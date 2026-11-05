-- FadeorFight database schema (UFC fight cards)
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Running it on a fresh project is safest. To start over on an existing
-- project, run supabase/reset.sql first.

-- ---------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------
create type user_role as enum ('member', 'analyst', 'admin');
create type card_segment as enum ('main', 'prelims', 'early_prelims');
create type corner as enum ('a', 'b');
create type fight_outcome as enum ('a', 'b', 'draw', 'nc');

-- ---------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  bio text,
  role user_role not null default 'member',
  created_at timestamptz not null default now()
);

create table events (
  id bigint generated always as identity primary key,
  slug text unique not null check (slug ~ '^[a-z0-9-]{3,80}$'),
  name text not null,                 -- 'UFC Fight Night: Okafor vs. Lindqvist'
  venue text,
  starts_at timestamptz not null,     -- first fight of the night; all picks lock here
  created_at timestamptz not null default now()
);

create table fights (
  id bigint generated always as identity primary key,
  event_id bigint not null references events(id) on delete cascade,
  segment card_segment not null default 'main',
  position int not null default 1,    -- 1 = top of that segment (main event first)
  fighter_a text not null,
  fighter_b text not null,
  weight_class text,
  rounds int not null default 3 check (rounds in (3, 5)),
  winner fight_outcome,               -- null until the fight is over
  result_method text,                 -- 'KO R2', 'Unanimous decision'
  created_at timestamptz not null default now()
);

create index fights_event_idx on fights (event_id, segment, position);

-- Welly's and Gordon's picks: one per analyst per fight.
create table analyst_picks (
  id bigint generated always as identity primary key,
  fight_id bigint not null references fights(id) on delete cascade,
  analyst_id uuid not null references profiles(id) on delete cascade,
  pick corner not null,
  method text,                        -- 'by KO', 'by decision'
  odds int check (odds is null or odds <= -100 or odds >= 100),
  write_up text,
  updated_at timestamptz not null default now(),
  unique (fight_id, analyst_id)
);

-- Members' own picks in the community section.
create table community_picks (
  fight_id bigint not null references fights(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  pick corner not null,
  updated_at timestamptz not null default now(),
  primary key (fight_id, user_id)
);

-- Post-card recaps: one per analyst per event.
create table recaps (
  id bigint generated always as identity primary key,
  event_id bigint not null references events(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  went_well text,
  went_wrong text,
  video_url text,                     -- YouTube link, optional
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, author_id)
);

-- Site-wide settings, like the livestream link. One row.
create table site_settings (
  id int primary key default 1 check (id = 1),
  live_url text,                      -- YouTube or Twitch link
  live_title text,
  is_live boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into site_settings (id) values (1);

-- Empty until the site goes paid.
create table subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  plan text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------
create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create function is_analyst() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('analyst', 'admin'));
$$;

create function has_active_subscription() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from subscriptions where user_id = auth.uid() and expires_at > now());
$$;

create function fight_is_main_card(f bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from fights where id = f and segment = 'main');
$$;

create function fight_has_started(f bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from fights x join events e on e.id = x.event_id
    where x.id = f and (e.starts_at <= now() or x.winner is not null)
  );
$$;

-- Create a profile row whenever someone signs up.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username, display_name)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ---------------------------------------------------------------
-- Integrity rules. auth.uid() is null in the SQL Editor, so these
-- don't block you when you fix things by hand there.
-- ---------------------------------------------------------------
create function guard_profile_update() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on profiles
for each row execute function guard_profile_update();

-- Picks lock when the event starts (admins can still correct them).
create function guard_pick_lock() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not is_admin() and fight_has_started(new.fight_id) then
    raise exception 'Picks for this card are locked because the event has started';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger analyst_picks_lock before insert or update on analyst_picks
for each row execute function guard_pick_lock();
create trigger community_picks_lock before insert or update on community_picks
for each row execute function guard_pick_lock();

-- ---------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------
alter table profiles enable row level security;
alter table events enable row level security;
alter table fights enable row level security;
alter table analyst_picks enable row level security;
alter table community_picks enable row level security;
alter table subscriptions enable row level security;

create policy "profiles are public" on profiles for select using (true);
create policy "edit own profile, admins edit any" on profiles
  for update using (id = auth.uid() or is_admin());

create policy "events are public" on events for select using (true);
create policy "admins manage events" on events for all using (is_admin()) with check (is_admin());

create policy "fights are public" on fights for select using (true);
create policy "admins manage fights" on fights for all using (is_admin()) with check (is_admin());

-- The paywall: main card picks are free; prelim and early prelim picks
-- need a subscription (analysts and admins always see everything).
create policy "main card free, prelims for subscribers" on analyst_picks
  for select using (
    fight_is_main_card(fight_id)
    or has_active_subscription()
    or is_analyst()
  );
create policy "analysts post their own picks, admins any" on analyst_picks
  for insert with check ((analyst_id = auth.uid() and is_analyst()) or is_admin());
create policy "analysts edit own picks, admins any" on analyst_picks
  for update using (analyst_id = auth.uid() or is_admin());
create policy "analysts delete own picks, admins any" on analyst_picks
  for delete using (analyst_id = auth.uid() or is_admin());

-- Members see only their own community picks; totals come from the view below.
create policy "see own community picks" on community_picks
  for select using (user_id = auth.uid());
create policy "make own community picks" on community_picks
  for insert with check (user_id = auth.uid());
create policy "change own community picks" on community_picks
  for update using (user_id = auth.uid());
create policy "remove own community picks" on community_picks
  for delete using (user_id = auth.uid());

create policy "see own subscription" on subscriptions
  for select using (user_id = auth.uid());

alter table recaps enable row level security;
alter table site_settings enable row level security;

create policy "recaps are public" on recaps for select using (true);
create policy "analysts write own recaps" on recaps
  for insert with check (author_id = auth.uid() and is_analyst());
create policy "analysts edit own recaps, admins any" on recaps
  for update using (author_id = auth.uid() or is_admin());
create policy "analysts delete own recaps, admins any" on recaps
  for delete using (author_id = auth.uid() or is_admin());

create policy "settings are public" on site_settings for select using (true);
create policy "admins change settings" on site_settings for update using (is_admin());

-- ---------------------------------------------------------------
-- Public views
-- ---------------------------------------------------------------

-- Crowd split per fight, without revealing who picked what.
create view community_split as
select fight_id,
       count(*) filter (where pick = 'a') as picks_a,
       count(*) filter (where pick = 'b') as picks_b
from community_picks
group by fight_id;

-- Analyst records across every graded fight, free and premium.
create view analyst_records as
select p.id, p.username, p.display_name, p.bio,
       count(*) filter (where f.winner in ('a', 'b') and ap.pick::text = f.winner::text) as wins,
       count(*) filter (where f.winner in ('a', 'b') and ap.pick::text <> f.winner::text) as losses,
       count(*) filter (where f.winner in ('draw', 'nc')) as pushes
from profiles p
left join analyst_picks ap on ap.analyst_id = p.id
left join fights f on f.id = ap.fight_id
where p.role in ('analyst', 'admin')
  and exists (select 1 from analyst_picks x where x.analyst_id = p.id)
group by p.id;

-- Community leaderboard (graded fights only).
create view community_leaders as
select p.username, p.display_name,
       count(*) filter (where cp.pick::text = f.winner::text) as wins,
       count(*) filter (where f.winner in ('a', 'b') and cp.pick::text <> f.winner::text) as losses
from community_picks cp
join fights f on f.id = cp.fight_id and f.winner is not null
join profiles p on p.id = cp.user_id
group by p.id;

grant select on community_split, analyst_records, community_leaders to anon, authenticated;

-- Restore profiles for anyone who signed up before this script ran.
insert into profiles (id, username, display_name)
select id, lower(raw_user_meta_data ->> 'username'),
       coalesce(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'username')
from auth.users
where raw_user_meta_data ->> 'username' ~ '^[A-Za-z0-9_]{3,20}$'
on conflict do nothing;

-- ---------------------------------------------------------------
-- After you sign up on the site, make yourself admin:
--   update profiles set role = 'admin' where username = 'your_username';
-- Then give Welly and Gordon analyst access from the dashboard.
-- ---------------------------------------------------------------
