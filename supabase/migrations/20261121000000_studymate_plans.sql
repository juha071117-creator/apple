begin;

create table public.studymate_plans (
  id integer generated always as identity (start with 1000) primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  school text not null,
  subject text not null,
  exam text not null,
  period text not null,
  content text not null,
  progress integer not null default 10 check (progress between 0 and 100),
  favorite boolean not null default false,
  attachment text not null default '',
  url text not null default ''
);

create index studymate_plans_owner_id_idx on public.studymate_plans (owner_id, id desc);

alter table public.studymate_plans enable row level security;
revoke all on public.studymate_plans from public, anon, authenticated;
grant select, insert, update on public.studymate_plans to authenticated;

create policy "Read own plans" on public.studymate_plans
  for select to authenticated using (owner_id = (select auth.uid()));

create policy "Create own plans" on public.studymate_plans
  for insert to authenticated with check (owner_id = (select auth.uid()));

create policy "Update own plans" on public.studymate_plans
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

commit;
