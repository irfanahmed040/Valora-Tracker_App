-- Migration v5: Generalize weekly_summaries to week/month/custom periods
alter table public.weekly_summaries
  add column if not exists period_type text not null default 'week';

alter table public.weekly_summaries
  drop constraint if exists weekly_summaries_user_id_week_start_key;

alter table public.weekly_summaries
  add constraint weekly_summaries_user_period_key unique (user_id, week_start, week_end);
