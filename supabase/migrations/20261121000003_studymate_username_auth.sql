begin;

-- Snapshot legacy aliases without exposing their email addresses to the browser.
create table public.studymate_legacy_usernames (
  username text primary key,
  owner_id uuid unique references auth.users(id) on delete cascade
);
insert into public.studymate_legacy_usernames (username, owner_id)
select lower(normalize(btrim(p.display_name), NFKC)),
       case when count(*) = 1 then min(p.owner_id::text)::uuid end
from public.studymate_profiles p join auth.users u on u.id = p.owner_id
where u.email is not null and u.email_confirmed_at is not null
group by lower(normalize(btrim(p.display_name), NFKC));

create table public.studymate_auth_limits (
  scope text primary key,
  bucket timestamptz not null,
  attempts integer not null
);
alter table public.studymate_legacy_usernames enable row level security;
alter table public.studymate_auth_limits enable row level security;
revoke all on public.studymate_legacy_usernames, public.studymate_auth_limits from public, anon, authenticated;

create function public.studymate_legacy_identity(input_username text)
returns table (login_email text, reserved boolean)
language sql stable security definer set search_path = '' as $$
  select u.email::text, true
  from public.studymate_legacy_usernames a left join auth.users u on u.id = a.owner_id
  where a.username = input_username;
$$;

create function public.studymate_take_auth_attempt(input_scope text, max_attempts integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  current_bucket timestamptz := date_trunc('minute', statement_timestamp());
  saved_attempts integer;
begin
  insert into public.studymate_auth_limits as limits(scope, bucket, attempts)
    values (input_scope, current_bucket, 1)
  on conflict (scope) do update
    set bucket = excluded.bucket,
        attempts = case when limits.bucket = excluded.bucket then limits.attempts + 1 else 1 end
    where limits.bucket < excluded.bucket or limits.attempts < max_attempts
  returning attempts into saved_attempts;

  if input_scope = 'global' then
    delete from public.studymate_auth_limits where bucket < current_bucket - interval '10 minutes';
  end if;
  return saved_attempts is not null;
end;
$$;

revoke all on function public.studymate_legacy_identity(text),
  public.studymate_take_auth_attempt(text, integer) from public, anon, authenticated;
grant execute on function public.studymate_legacy_identity(text),
  public.studymate_take_auth_attempt(text, integer) to service_role;

-- Create the mapping key once. Only the server role may retrieve it.
create table public.studymate_auth_key (
  singleton boolean primary key default true check (singleton),
  mapping_key text not null
);
insert into public.studymate_auth_key (mapping_key)
values (gen_random_uuid()::text || gen_random_uuid()::text);
alter table public.studymate_auth_key enable row level security;
revoke all on public.studymate_auth_key from public, anon, authenticated;
create function public.studymate_username_key()
returns text language sql stable security definer set search_path = '' as $$
  select mapping_key from public.studymate_auth_key where singleton;
$$;
revoke all on function public.studymate_username_key() from public, anon, authenticated;
grant execute on function public.studymate_username_key() to service_role;

commit;
