-- DayTrack — Migration v2
-- Run in Supabase SQL Editor after the initial schema

-- Add specific_date (for oneoff tasks) and recurring_days (e.g. [0,6] for Sun+Sat)
alter table public.targets
  add column if not exists specific_date date,
  add column if not exists recurring_days integer[];

-- Extend scope check to include 'oneoff'
alter table public.targets drop constraint if exists targets_scope_check;
alter table public.targets add constraint targets_scope_check
  check (scope in ('daily', 'weekly', 'oneoff'));
