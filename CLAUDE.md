# FadeorFight

UFC picks site: Welly's and Gordon's pick on every fight of every card, recaps, livestream, and community pick'em.

- Next.js 16 (App Router, `proxy.ts` instead of middleware) + Supabase (auth + Postgres). Hosted on Vercel.
- Design: black background, lime (`#b9f227`) accents, Barlow Condensed italic uppercase for display type. All styling is in `app/globals.css`; colours are tokens at the top.
- Without Supabase keys the site runs on demo data from `lib/demo.ts`. All reads go through `lib/data.ts`; all form submissions are server actions in `app/actions.ts`.
- Database rules live in `supabase/schema.sql` (row-level security + triggers). Picks lock at event start, only admins enter results or change roles, and prelim/early-prelim analyst picks are hidden from non-subscribers by RLS. Keep those rules in the database, not just the UI.
- Roles: `member`, `analyst` (Welly, Gordon), `admin`.
- Check changes with `npm run build` before committing.
