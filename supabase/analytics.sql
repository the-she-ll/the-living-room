-- The Living Room: anonymous visitor analytics
-- Run AFTER setup.sql. Paste this whole file into Supabase → SQL Editor →
-- New query → Run. Safe to run again.
--
-- Each phone gets a random id (no names, emails, locations or IPs are
-- stored). Visitors can only add events; only guestbook admins can read the
-- totals, through app_stats() on the ?admin page.

create table if not exists public.app_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor    text not null check (char_length(visitor) between 8 and 40),
  session    text check (session is null or char_length(session) <= 40),
  event      text not null check (char_length(event) between 1 and 30),
  target     text check (target is null or char_length(target) <= 40),
  via        text check (via is null or char_length(via) <= 20),
  seconds    real check (seconds is null or seconds between 0 and 36000)
);
create index if not exists app_events_created_at_idx on public.app_events (created_at desc);

create or replace function public.app_events_check()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.created_at := now();
  -- flood guard: drop events beyond 1,000 a minute, gallery-wide
  if (select count(*) from public.app_events where created_at > now() - interval '1 minute') >= 1000 then
    return null;
  end if;
  return new;
end $$;

drop trigger if exists app_events_check on public.app_events;
create trigger app_events_check
  before insert on public.app_events
  for each row execute function public.app_events_check();

alter table public.app_events enable row level security;

drop policy if exists "Anyone can add events" on public.app_events;
create policy "Anyone can add events" on public.app_events
  for insert to anon, authenticated with check (true);

drop policy if exists "Admins can read events" on public.app_events;
create policy "Admins can read events" on public.app_events
  for select to authenticated using (public.guestbook_is_admin());

drop policy if exists "Admins can clear events" on public.app_events;
create policy "Admins can clear events" on public.app_events
  for delete to authenticated using (public.guestbook_is_admin());

revoke all on public.app_events from anon, authenticated;
grant insert (visitor, session, event, target, via, seconds) on public.app_events to anon, authenticated;
grant select, delete on public.app_events to authenticated;

-- Totals for the admin page. `days` = how far back; `tz` = your time zone,
-- for grouping by day.
create or replace function public.app_stats(days int default 30, tz text default 'UTC')
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  since timestamptz := now() - make_interval(days => greatest(days, 1));
begin
  if not public.guestbook_is_admin() then
    raise exception 'not_admin';
  end if;
  return jsonb_build_object(
    'visitors', (select count(distinct visitor) from app_events where created_at > since and event = 'visit'),
    'entered',  (select count(distinct visitor) from app_events where created_at > since and event = 'enter'),
    'visits',   (select count(distinct session) from app_events where created_at > since and event = 'visit'),
    'daily', (
      select coalesce(jsonb_agg(d order by d.day desc), '[]'::jsonb) from (
        select (created_at at time zone tz)::date as day,
               count(distinct visitor) filter (where event = 'visit') as visitors,
               count(distinct visitor) filter (where event = 'enter') as entered
        from app_events where created_at > since group by 1
      ) d
    ),
    'events', (
      select coalesce(jsonb_agg(e), '[]'::jsonb) from (
        select event, target, via,
               count(*) as times,
               count(distinct visitor) as people,
               round(avg(seconds)::numeric, 1) as avg_seconds
        from app_events where created_at > since group by event, target, via
      ) e
    )
  );
end $$;
revoke all on function public.app_stats(int, text) from public, anon;
grant execute on function public.app_stats(int, text) to authenticated;
