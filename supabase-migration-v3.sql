-- Migration v3: Add start_date and end_date to targets
alter table public.targets
  add column if not exists start_date date,
  add column if not exists end_date date;
