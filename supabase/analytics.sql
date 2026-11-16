-- The Living Room: anonymous visitor analytics
-- Run AFTER setup.sql. Paste this whole file into Supabase → SQL Editor →
-- New query → Run. Safe to run again.
--
-- Each phone gets a random id (no names, emails, locations or IPs are
-- stored). Visitors can only add events; you read the
-- reports in the Supabase dashboard (see the bottom of this file).

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

-- --------------------------------------------------------------- reports
-- Read these in Supabase → Table Editor → schema "analytics" (dropdown at
-- the top left), or SQL Editor: select * from analytics.voice_notes;
-- They live in their own schema, which the public app can't reach.
-- Days are grouped in the time zone below; change it if yours differs.

drop function if exists public.app_stats(int, text);
create schema if not exists analytics;
revoke all on schema analytics from public, anon, authenticated;

create or replace function analytics.tz() returns text language sql immutable as $$ select 'America/New_York' $$;

create or replace view analytics.overview as
select period,
       count(distinct visitor) filter (where event = 'visit') as people_opened_app,
       count(distinct visitor) filter (where event = 'enter') as people_tapped_enter,
       count(distinct session) filter (where event = 'visit') as visits,
       count(distinct visitor) filter (where event = 'voice_play') as people_played_a_voice_note,
       count(distinct visitor) filter (where event = 'guestbook_post') as people_posted_a_memory
from public.app_events
cross join lateral (values ('1 today', (now() at time zone analytics.tz())::date::timestamp at time zone analytics.tz()),
                           ('2 last 7 days', now() - interval '7 days'),
                           ('3 last 30 days', now() - interval '30 days'),
                           ('4 all time', '-infinity'::timestamptz)) p(period, since)
where created_at >= since
group by period order by period;

create or replace view analytics.daily as
select (created_at at time zone analytics.tz())::date as day,
       count(distinct visitor) filter (where event = 'visit') as people_opened_app,
       count(distinct visitor) filter (where event = 'enter') as people_tapped_enter,
       count(distinct visitor) filter (where event = 'voice_play') as people_played_voice_notes,
       count(distinct visitor) filter (where event = 'found') as people_found_a_frequency
from public.app_events group by 1 order by 1 desc;

create or replace view analytics.voice_notes as
with v(id, voice_note) as (values
  ('vm-1', '1. My Evolving Views on Technology'),
  ('vm-2', '2. When Friends See You Even When You Don''t'),
  ('vm-3', '3. My Sister''s Keeper, a Fellow Workaholic'),
  ('vm-4', '4. Navigating New Love: Talks with Friends'),
  ('vm-5', '5. My Biggest Challenges in an Interview'),
  ('vm-6', '6. My Last Act of Love'))
select v.voice_note,
       count(distinct e.visitor) filter (where e.event = 'voice_play') as people,
       count(*) filter (where e.event = 'voice_play') as plays,
       count(*) filter (where e.event = 'voice_end' and e.via = 'finished') as heard_to_the_end,
       count(*) filter (where e.event = 'voice_end' and e.via = 'stopped') as hung_up_or_switched,
       count(*) filter (where e.event = 'voice_end' and e.via = 'left') as left_the_app,
       round(avg(e.seconds) filter (where e.event = 'voice_end')::numeric) as avg_seconds_listened
from v left join public.app_events e on e.target = v.id
group by v.id, v.voice_note order by v.id;

create or replace view analytics.frequencies as
with f(id, frequency) as (values
  ('portraits', 'Portraits of Power'), ('table', 'The People''s Press'),
  ('turntable', 'The Rhythm & Sanctuary'), ('phone', 'The Porch Lifeline'))
select f.frequency,
       count(distinct e.visitor) filter (where e.event = 'found' and e.via = 'nfc') as found_by_nfc_tag,
       count(distinct e.visitor) filter (where e.event = 'found' and e.via = 'ar') as found_by_ar_lens,
       count(distinct e.visitor) filter (where e.event = 'found' and e.via = 'map') as found_by_map,
       count(distinct e.visitor) filter (where e.event = 'story_open' and e.via = 'unlocked') as opened_story,
       count(distinct e.visitor) filter (where e.event = 'story_open' and e.via = 'locked') as checked_hint_while_locked
from f left join public.app_events e on e.target = f.id
group by f.id, f.frequency order by min(array_position(array['portraits','table','turntable','phone'], f.id));

create or replace view analytics.everything as
select event, target, via,
       count(*) as times,
       count(distinct visitor) as people,
       round(avg(seconds)::numeric, 1) as avg_seconds
from public.app_events group by event, target, via order by event, times desc;

revoke all on all tables in schema analytics from public, anon, authenticated;
