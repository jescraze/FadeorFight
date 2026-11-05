-- Deletes all FadeorFight tables and data (user logins are kept).
-- Only run this if you want to start the database over.
drop view if exists community_leaders, analyst_records, community_split, capper_records cascade;
drop table if exists recaps, site_settings, community_picks, analyst_picks, fights, events, picks, sports, subscriptions, profiles cascade;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user, guard_profile_update, guard_pick_lock, guard_pick_insert,
  guard_pick_update, lock_started_picks, is_admin, is_analyst, is_contributor,
  has_active_subscription, fight_is_main_card, fight_has_started cascade;
drop type if exists fight_outcome, corner, card_segment, pick_result, user_role cascade;
