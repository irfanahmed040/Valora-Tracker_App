-- DayTrack — Supabase SQL Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- Targets table
create table if not exists public.targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  scope text not null check (scope in ('daily', 'weekly')),
  task_type text not null check (task_type in ('hours', 'checkbox', 'counter')),
  target_value numeric,
  unit text,
  color text default '#6366f1',
  emoji text default '🎯',
  priority text default 'medium' check (priority in ('high', 'medium', 'low')),
  weekly_goal numeric,
  active boolean default true,
  created_at timestamptz default now()
);

-- Daily logs table (one row per user/target/date)
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  target_id uuid references public.targets on delete cascade not null,
  date date not null,
  value numeric default 0,
  completed boolean default false,
  notes text,
  created_at timestamptz default now(),
  unique (user_id, target_id, date)
);

-- Increments table (individual hour/count additions)
create table if not exists public.increments (
  id uuid primary key default gen_random_uuid(),
  log_id uuid references public.daily_logs on delete cascade not null,
  value numeric not null,
  note text,
  created_at timestamptz default now()
);

-- Weekly AI summaries
create table if not exists public.weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  week_start date not null,
  week_end date not null,
  content text not null,
  generated_at timestamptz default now(),
  unique (user_id, week_start)
);

-- Row Level Security (RLS)
alter table public.targets enable row level security;
alter table public.daily_logs enable row level security;
alter table public.increments enable row level security;
alter table public.weekly_summaries enable row level security;

-- Targets: users can only see/modify their own
create policy "targets_owner" on public.targets
  for all using (auth.uid() = user_id);

-- Daily logs: users can only see/modify their own
create policy "daily_logs_owner" on public.daily_logs
  for all using (auth.uid() = user_id);

-- Increments: users can access via their logs
create policy "increments_owner" on public.increments
  for all using (
    exists (
      select 1 from public.daily_logs
      where daily_logs.id = increments.log_id
      and daily_logs.user_id = auth.uid()
    )
  );

-- Summaries: users can only see/modify their own
create policy "summaries_owner" on public.weekly_summaries
  for all using (auth.uid() = user_id);

-- Indexes for query performance
create index if not exists idx_targets_user_id on public.targets(user_id);
create index if not exists idx_daily_logs_user_date on public.daily_logs(user_id, date);
create index if not exists idx_daily_logs_target_id on public.daily_logs(target_id);
create index if not exists idx_increments_log_id on public.increments(log_id);
create index if not exists idx_weekly_summaries_user_week on public.weekly_summaries(user_id, week_start);
