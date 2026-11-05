# FadeorFight

UFC picks from Welly and Gordon on every fight, recaps after every card, livestreams, and a community pick'em. Built with Next.js and Supabase.

## What's on the site

| Page | What it does |
| --- | --- |
| Home (`/`) | Welcome, quick intro, the next card, and links to every section |
| Fight cards (`/events`) | Every UFC card. Each fight shows Welly's and Gordon's pick side by side: winner, method, odds and write-up |
| Welly's picks, Gordon's picks (`/picks/welly`) | One analyst's picks across every card, with record and hit rate |
| Recaps (`/recaps`) | After each card: what went well, what didn't, plus an optional video |
| Watch (`/watch`) | Your livestream when you're live, recap videos the rest of the time |
| Community (`/community`) | Members pick every fight themselves, see the crowd split, and climb a leaderboard |
| About (`/about`) | Your story. Edit the text in `app/about/page.tsx` |
| Dashboard (`/dashboard`) | Admins add cards, fights, results and the livestream. Analysts post picks and recaps |

**The paywall:** main card picks are free. Prelim and early prelim picks are blurred for everyone except paid members, Welly, Gordon and admins. The database enforces this, so the hidden picks are never sent to free users' browsers. Since paid memberships don't exist yet, everyone else sees them blurred for now.

**Fairness rules, also enforced by the database:** picks lock when the first fight of the card starts, only admins enter results, and only admins change who's an analyst.

Without Supabase keys the site runs on made-up sample fights so you can click around.

## Run it on your computer

```bash
npm install
npm run dev
```

Open http://localhost:3000. Press Ctrl+C in the terminal to stop it. Changes you save show up in the browser automatically.

## Go live

Everything here has a free tier; the domain is the only cost (about $15 a year).

### 1. Database (Supabase, free)

1. Create a project at supabase.com.
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and click **Run**.

Already ran the older version of the schema from the first build? Run `supabase/reset.sql` first, then `schema.sql`. That wipes the old tables (there's no real data in them yet) but keeps logins.

### 2. Connect the site

In Supabase, go to **Project Settings → API** and copy the project URL and publishable (anon) key.

```bash
cp .env.example .env.local
```

Paste both values into `.env.local` and restart `npm run dev`. The lime demo banner disappears.

### 3. Host it

Push this folder to a private GitHub repository, then import it into Vercel (or Cloudflare). Add the two values from `.env.local` as environment variables and deploy.

Vercel's free plan is for non-commercial sites. That's fine while everything's free; once you charge for memberships, move to Vercel Pro or Cloudflare's free plan, which allows commercial use.

### 4. Domain

Buy it at Cloudflare or Porkbun, then add it under your Vercel project's **Settings → Domains** and follow the DNS steps.

In Supabase, go to **Authentication → URL Configuration**. Set **Site URL** to `https://yourdomain.com` and add `https://yourdomain.com/auth/callback` under **Redirect URLs**.

### 5. Set up the team

1. Sign up on the site, then make yourself admin in the Supabase SQL Editor:
   ```sql
   update profiles set role = 'admin' where username = 'your_username';
   ```
2. Have Welly and Gordon sign up. On your dashboard, under **Manage access**, set each of their usernames to **Analyst**. They appear in the menu as "Welly's picks" and "Gordon's picks" using the display name on their profile.

## Running a fight week

1. **Admin:** Dashboard → **Create a card** (name, venue, when the first fight starts).
2. **Admin:** open the card and **Add a fight** for each bout. Choose main card, prelims or early prelims, and an order (1 = top). Order 1 on the main card is labeled the main event and 2 the co-main.
3. **Welly and Gordon:** open the card from their dashboard and save a pick on each fight. Everything locks when the first fight starts.
4. **Fight night (optional):** Dashboard → **Livestream**. Paste the YouTube or Twitch link and tick "We're live". A banner appears on the home page and the stream plays on Watch. Untick it when you're done.
5. **After the card, admin:** enter each result. Every pick, analyst and community, is graded automatically.
6. **Welly and Gordon:** write a recap at the bottom of the card's dashboard page, with a YouTube link if they made a video.

## Things to know about the free tiers

- Supabase pauses free projects after a week with no visitors. Unpause from the Supabase dashboard if it happens before launch.
- Supabase's built-in email sends only a few messages an hour. Before launch, connect a free email service (such as Resend) under **Authentication → SMTP Settings**, or turn off **Confirm email** under **Authentication → Providers → Email**.

## Going paid later

1. Add Stripe (or Lemon Squeezy) Checkout for a membership.
2. When a payment succeeds, a small webhook adds or extends that user's row in the `subscriptions` table. The prelim picks unlock for them immediately; nothing else needs to change.
3. Check first that your payment processor allows betting-picks content. Some treat it as restricted.

## Where things live

```
app/
  page.tsx                   home
  events/                    fight cards
  picks/[username]/          an analyst's picks page
  recaps/, watch/            recaps and video
  community/                 member pick'em and leaderboard
  about/page.tsx             about us (edit this text)
  dashboard/                 admin and analyst tools
  actions.ts                 every form submission
  globals.css                all styling (colours at the top)
components/                  fight rows, recap cards, header
lib/
  data.ts                    database reads (falls back to demo data)
  demo.ts                    sample fights shown in demo mode
supabase/
  schema.sql                 tables, rules and the paywall
  reset.sql                  wipes the tables to start over
```
