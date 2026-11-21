begin;

create table public.studymate_profiles (
  owner_id uuid primary key default auth.uid() references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  school_name text not null default '',
  school_type text not null default ''
);
create table public.studymate_items (
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('homework', 'dday', 'quiz', 'preferences')),
  item_id bigint not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  primary key (owner_id, kind, item_id)
);
alter table public.studymate_profiles enable row level security;
alter table public.studymate_items enable row level security;
revoke all on public.studymate_profiles, public.studymate_items from public, anon, authenticated;
grant select, insert, update on public.studymate_profiles, public.studymate_items to authenticated;
create policy "Own profile" on public.studymate_profiles for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Own items" on public.studymate_items for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- Community owner IDs are visible only to the database functions.
create table public.studymate_posts (
  id integer generated always as identity primary key,
  owner_id uuid not null references auth.users on delete cascade,
  school_type text not null check (school_type in ('univ','high','mid','etc')),
  school_name text not null,
  subject text not null,
  exam text not null,
  tags text[] not null,
  content text not null check (char_length(btrim(content)) between 1 and 10000),
  anonymous boolean not null,
  created_at timestamptz not null default now()
);
create table public.studymate_comments (
  id integer generated always as identity primary key,
  post_id integer not null references public.studymate_posts on delete cascade,
  owner_id uuid not null references auth.users on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  anonymous boolean not null,
  created_at timestamptz not null default now()
);
create index studymate_comments_post_idx on public.studymate_comments (post_id, id);
create table public.studymate_likes (
  post_id integer references public.studymate_posts on delete cascade,
  owner_id uuid references auth.users on delete cascade,
  primary key (post_id, owner_id)
);
create table public.studymate_plan_transfers (
  token uuid primary key default gen_random_uuid(),
  source_id uuid not null unique references auth.users on delete cascade,
  expires_at timestamptz not null
);
alter table public.studymate_posts enable row level security;
alter table public.studymate_comments enable row level security;
alter table public.studymate_likes enable row level security;
alter table public.studymate_plan_transfers enable row level security;
revoke all on public.studymate_posts, public.studymate_comments, public.studymate_likes, public.studymate_plan_transfers from public, anon, authenticated;

create function public.studymate_issue_transfer() returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if auth.uid() is null or not coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Guest session required';
  end if;
  insert into public.studymate_plan_transfers(source_id, expires_at)
  values (auth.uid(), now() + interval '5 minutes')
  on conflict (source_id) do update set token = gen_random_uuid(), expires_at = excluded.expires_at
  returning token into result;
  return result;
end;
$$;
create function public.studymate_claim_transfer(transfer_token uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare source uuid;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, true) then
    raise exception 'Member session required';
  end if;
  delete from public.studymate_plan_transfers
   where token = transfer_token and expires_at > now() returning source_id into source;
  if source is null then raise exception 'Transfer expired'; end if;
  update public.studymate_plans set owner_id = auth.uid() where owner_id = source;
  insert into public.studymate_items(owner_id, kind, item_id, data)
    select auth.uid(), kind, item_id, data from public.studymate_items where owner_id = source
    on conflict do nothing;
end;
$$;

create function public.studymate_feed(before_id integer default null)
returns table(id integer, school_type text, school_name text, subject text, exam text,
              tags text[], content text, author text, created_at timestamptz, likes bigint, comments bigint, liked boolean)
language sql stable security definer set search_path = '' as $$
  select p.id, p.school_type, p.school_name, p.subject, p.exam, p.tags, p.content,
    case when p.anonymous then '익명' else coalesce(u.display_name, '사용자') end,
    p.created_at,
    (select count(*) from public.studymate_likes l where l.post_id=p.id),
    (select count(*) from public.studymate_comments c where c.post_id=p.id),
    exists(select 1 from public.studymate_likes l where l.post_id=p.id and l.owner_id=auth.uid())
  from public.studymate_posts p left join public.studymate_profiles u on u.owner_id=p.owner_id
  where auth.uid() is not null and (before_id is null or p.id < before_id)
  order by p.id desc limit 50;
$$;

create function public.studymate_create_post(entry jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare new_id integer;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, true) then
    raise exception 'Member session required';
  end if;
  insert into public.studymate_posts(owner_id, school_type, school_name, subject, exam, tags, content, anonymous)
    values (auth.uid(), entry->>'schoolType', entry->>'schoolName', entry->>'subject', entry->>'exam',
            array(select jsonb_array_elements_text(entry->'tags')), entry->>'content', (entry->>'anonymous')::boolean)
    returning id into new_id;
  return new_id;
end;
$$;

create function public.studymate_list_comments(target integer)
returns table(id integer, content text, author text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, c.content, case when c.anonymous then '익명' else coalesce(u.display_name, '사용자') end, c.created_at
    from public.studymate_comments c left join public.studymate_profiles u on u.owner_id=c.owner_id
    where auth.uid() is not null and c.post_id=target order by c.id;
$$;

create function public.studymate_add_comment(target integer, body text, hide_author boolean) returns integer
language plpgsql security definer set search_path = '' as $$
declare new_id integer;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, true) then
    raise exception 'Member session required';
  end if;
  insert into public.studymate_comments(post_id, owner_id, content, anonymous)
    values (target, auth.uid(), body, hide_author) returning id into new_id;
  return new_id;
end;
$$;

create function public.studymate_set_like(target integer, enabled boolean) returns bigint
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, true) then
    raise exception 'Member session required';
  end if;
  if enabled then
    insert into public.studymate_likes(post_id, owner_id) values (target, auth.uid()) on conflict do nothing;
  else
    delete from public.studymate_likes where post_id=target and owner_id=auth.uid();
  end if;
  return (select count(*) from public.studymate_likes where post_id=target);
end;
$$;

revoke all on function public.studymate_issue_transfer(), public.studymate_claim_transfer(uuid),
 public.studymate_feed(integer), public.studymate_create_post(jsonb), public.studymate_list_comments(integer),
 public.studymate_add_comment(integer,text,boolean), public.studymate_set_like(integer,boolean)
 from public, anon, authenticated;
grant execute on function public.studymate_issue_transfer(), public.studymate_claim_transfer(uuid),
 public.studymate_feed(integer), public.studymate_create_post(jsonb), public.studymate_list_comments(integer),
 public.studymate_add_comment(integer,text,boolean), public.studymate_set_like(integer,boolean)
 to authenticated;

alter table public.studymate_plans add column attachment_path text;
revoke update on public.studymate_plans from authenticated;
grant update (progress, favorite) on public.studymate_plans to authenticated;
drop policy "Create own plans" on public.studymate_plans;
create policy "Create own plans" on public.studymate_plans for insert to authenticated
 with check (owner_id = (select auth.uid()) and
   (attachment_path is null or split_part(attachment_path, '/', 1) = (select auth.uid())::text));
insert into storage.buckets(id, name, public, file_size_limit)
values ('studymate-attachments','studymate-attachments',false,10485760);
create policy "StudyMate upload own attachments" on storage.objects for insert to authenticated
 with check (bucket_id = 'studymate-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "StudyMate read own attachments" on storage.objects for select to authenticated
 using (bucket_id = 'studymate-attachments' and (
   exists(select 1 from public.studymate_plans p where p.attachment_path=objects.name
     and p.owner_id=(select auth.uid()))
 ));
create policy "StudyMate remove unreferenced uploads" on storage.objects for delete to authenticated
 using (bucket_id = 'studymate-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text
   and not exists(select 1 from public.studymate_plans p where p.attachment_path=objects.name));

commit;
