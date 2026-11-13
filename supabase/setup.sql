-- The Living Room: shared guestbook
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run again; it updates what's already there.
--
-- BEFORE RUNNING: replace REPLACE_WITH_YOUR_EMAIL (bottom of the file) with
-- the email you'll use to sign in to the guestbook admin page.

-- ---------------------------------------------------------------- tables

create table if not exists public.guestbook_entries (
  id         uuid primary key default gen_random_uuid(),
  text       text not null check (char_length(text) between 1 and 160),
  name       text check (name is null or char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);
create index if not exists guestbook_entries_created_at_idx on public.guestbook_entries (created_at desc);

-- Words that can't be posted. match_prefix = true also blocks words that
-- start with it (e.g. 'fuck' blocks 'fucking'). Add your own any time:
--   insert into public.guestbook_blocklist (word) values ('newword');
create table if not exists public.guestbook_blocklist (
  word         text primary key,
  match_prefix boolean not null default false
);

-- Emails allowed to delete entries from the admin page.
create table if not exists public.guestbook_admins (
  email text primary key
);

-- ---------------------------------------------------------- word filter

-- Lowercase, undo common look-alike swaps (f4ck, $hit, sh1t), and turn
-- everything that isn't a letter into spaces.
create or replace function public.guestbook_normalize(t text)
returns text language sql immutable as $$
  select regexp_replace(translate(lower(coalesce(t, '')), '013457@$!|', 'oieastasii'), '[^a-z]+', ' ', 'g')
$$;

create or replace function public.guestbook_has_blocked(t text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from regexp_split_to_table(public.guestbook_normalize(t), '\s+') as w(tok)
    join public.guestbook_blocklist b
      on w.tok = b.word
      or (b.match_prefix and w.tok like b.word || '%')
      -- stretched spellings ("shiiit"), only for words long enough not to clash
      or (char_length(regexp_replace(b.word, '(.)\1+', '\1', 'g')) >= 4
          and regexp_replace(w.tok, '(.)\1+', '\1', 'g') = regexp_replace(b.word, '(.)\1+', '\1', 'g'))
    where w.tok <> ''
  )
$$;

create or replace function public.guestbook_check()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.text := btrim(regexp_replace(new.text, '\s+', ' ', 'g'));
  new.name := nullif(btrim(regexp_replace(coalesce(new.name, ''), '\s+', ' ', 'g')), '');
  new.created_at := now();

  if public.guestbook_has_blocked(new.text) or public.guestbook_has_blocked(new.name) then
    raise exception 'blocked_words' using hint = 'Please rephrase your memory.';
  end if;

  -- flood guard against scripts: at most 30 new memories a minute, gallery-wide
  if (select count(*) from public.guestbook_entries where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'slow_down' using hint = 'Lots of memories right now. Try again in a minute.';
  end if;
  return new;
end $$;

drop trigger if exists guestbook_check on public.guestbook_entries;
create trigger guestbook_check
  before insert on public.guestbook_entries
  for each row execute function public.guestbook_check();

-- Lets the admin page check "am I an admin?" without exposing the list.
create or replace function public.guestbook_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.guestbook_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

-- -------------------------------------------------------- access rules

alter table public.guestbook_entries   enable row level security;
alter table public.guestbook_blocklist enable row level security; -- no policies: private
alter table public.guestbook_admins    enable row level security; -- no policies: private

drop policy if exists "Anyone can read memories" on public.guestbook_entries;
create policy "Anyone can read memories" on public.guestbook_entries
  for select to anon, authenticated using (true);

drop policy if exists "Anyone can add a memory" on public.guestbook_entries;
create policy "Anyone can add a memory" on public.guestbook_entries
  for insert to anon, authenticated with check (true);

drop policy if exists "Admins can delete memories" on public.guestbook_entries;
create policy "Admins can delete memories" on public.guestbook_entries
  for delete to authenticated using (public.guestbook_is_admin());

-- Nobody can edit an entry after it's posted (no update policy). Only the
-- columns a visitor fills in can be sent.
revoke all on public.guestbook_entries from anon, authenticated;
grant select on public.guestbook_entries to anon, authenticated;
grant insert (text, name) on public.guestbook_entries to anon, authenticated;
grant delete on public.guestbook_entries to authenticated;
revoke all on public.guestbook_blocklist, public.guestbook_admins from anon, authenticated;
grant execute on function public.guestbook_is_admin() to anon, authenticated;

-- ------------------------------------------------------------ blocklist
-- Common profanity and slurs. Deliberately leaves out words with everyday
-- or historical uses (e.g. "damn", "hell", "Negro Digest", a garden "hoe",
-- names like "Dick Gregory");
-- delete anything that slips through from the admin page.
insert into public.guestbook_blocklist (word, match_prefix) values
  ('fuck', true), ('motherfuck', true), ('fuk', false), ('fck', false), ('fcuk', false), ('fvck', true), ('fack', false),
  ('shit', true), ('bullshit', true), ('shitty', false),
  ('bitch', true), ('cunt', true), ('twat', true), ('wank', true),
  ('ass', false), ('asses', false), ('asshole', true), ('arsehole', true), ('jackass', false), ('dumbass', false),
  ('bastard', true), ('cocksucker', true), ('pussy', false), ('pussies', false),
  ('whore', true), ('slut', true), ('jizz', true), ('porn', true),
  ('nigger', true), ('nigga', true), ('niggas', false),
  ('fag', false), ('fags', false), ('faggot', true), ('dyke', true), ('tranny', true),
  ('kike', true), ('spic', false), ('spics', false), ('chink', true), ('gook', true), ('wetback', true),
  ('coon', false), ('coons', false), ('jigaboo', true), ('porchmonkey', true), ('retard', true)
on conflict (word) do update set match_prefix = excluded.match_prefix;

-- --------------------------------------------------------------- admin
insert into public.guestbook_admins (email) values ('REPLACE_WITH_YOUR_EMAIL')
on conflict do nothing;
