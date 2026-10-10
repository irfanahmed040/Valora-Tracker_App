-- Migration v7: Custom exercise library for fitness tracking
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now()
);

-- One exercise name per user (case-insensitive)
create unique index if not exists exercises_user_name_idx
  on public.exercises (user_id, lower(name));

alter table public.exercises enable row level security;

create policy "exercises_owner" on public.exercises
  for all using (auth.uid() = user_id);
