begin;

create table public.studymate_signup_reservations (
  username_hash text primary key,
  claim_id uuid not null,
  expires_at timestamptz not null
);
alter table public.studymate_signup_reservations enable row level security;
revoke all on public.studymate_signup_reservations from public, anon, authenticated;

create function public.studymate_reserve_signup(input_hash text, input_claim uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  reserved boolean;
begin
  delete from public.studymate_signup_reservations where expires_at < statement_timestamp();
  insert into public.studymate_signup_reservations(username_hash, claim_id, expires_at)
    values (input_hash, input_claim, statement_timestamp() + interval '2 minutes')
  on conflict (username_hash) do nothing
  returning true into reserved;
  return coalesce(reserved, false);
end;
$$;

create function public.studymate_release_signup(input_hash text, input_claim uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.studymate_signup_reservations where username_hash = input_hash and claim_id = input_claim;
$$;

revoke all on function public.studymate_reserve_signup(text, uuid),
  public.studymate_release_signup(text, uuid) from public, anon, authenticated;
grant execute on function public.studymate_reserve_signup(text, uuid),
  public.studymate_release_signup(text, uuid) to service_role;

commit;
