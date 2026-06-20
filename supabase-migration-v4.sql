-- Migration v4: Soft delete for targets
alter table public.targets
  add column if not exists deleted_at timestamptz;
