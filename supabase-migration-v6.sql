-- Migration v6: Fitness tracking — workout sets
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  exercise text not null,
  reps integer not null default 0,
  weight numeric,          -- kg; null = bodyweight
  created_at timestamptz default now()
);

create index if not exists workout_sets_user_date_idx on public.workout_sets (user_id, date);
create index if not exists workout_sets_user_created_idx on public.workout_sets (user_id, created_at desc);

alter table public.workout_sets enable row level security;

create policy "workout_sets_owner" on public.workout_sets
  for all using (auth.uid() = user_id);
