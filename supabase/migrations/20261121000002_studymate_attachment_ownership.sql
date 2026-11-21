begin;

-- A transferred file is reachable only through its single owning plan.
create unique index if not exists studymate_plans_attachment_path_idx
  on public.studymate_plans (attachment_path) where attachment_path is not null;
alter policy "StudyMate remove unreferenced uploads" on storage.objects using (false);

commit;
