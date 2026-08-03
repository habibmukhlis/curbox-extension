-- Stable keyset pagination prevents records that share an updated_at value
-- from being skipped or duplicated between pull pages.
alter table public.sync_records
  add column if not exists id uuid default gen_random_uuid();

update public.sync_records
set id = gen_random_uuid()
where id is null;

alter table public.sync_records
  alter column id set default gen_random_uuid(),
  alter column id set not null;

create unique index if not exists sync_records_id_idx
  on public.sync_records (id);

create index if not exists sync_records_user_updated_id_idx
  on public.sync_records (user_id, updated_at, id);

-- The composite index is a strict superset of the former two-column index.
drop index if exists public.sync_records_user_updated_idx;
