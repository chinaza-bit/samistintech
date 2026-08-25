# SamistInTech

A social + marketplace + blog + business platform. Built with Next.js, TypeScript, Tailwind CSS, and Supabase (database, auth, storage, realtime chat) — all on free tiers.

## What's built

- Sign up (with account type: personal/blogger/business) + email verification
- Login with email/password verification checks
- Password reset via email
- Home feed with Stories bar (auto-expire 24h)
- Post editor: text, image, video, background music, emoji, background color, text size/color, links
- Marketplace, Technology Trends, Business Trends, Reels (≤60 min), Blog — all reuse the same post system, separated by category
- Profile page: followers/following counts, your posts, create-post shortcut
- Settings: edit profile, change password, log out
- Realtime chat (Supabase Realtime)
- 3-dot menu on every post: Share, Copy text, Download, Forward
- Comments on every post
- Likes on every post, with a live count
- Follow / unfollow buttons, wired to real follower/following counts
- Public profile pages at `/u/[id]` for viewing any user (with their posts and, for businesses, their products)
- Business page at `/business`: switch to a business account, set business name/link, post products (title, description, price, link, image, video ≤30 min)
- Long-form Blog editor at `/blog`: title, cover image, and a rich text body (bold/italic/underline/headings/inline images) — separate from the short posts used everywhere else
- Notifications bell (top-right of every page) with a live unread badge, and a full `/notifications` page — fires on likes, comments, follows, and new chat messages
- Row Level Security so users can only edit their own data
- Route protection middleware (logged-out users get redirected to /login)

---

## 1. Run it on your own computer

You'll need [Node.js](https://nodejs.org) (LTS) and [Git](https://git-scm.com) installed.

```bash
cd samistintech
npm install
cp .env.local.example .env.local
```

## 2. Set up your free Supabase backend

1. Go to [supabase.com](https://supabase.com) → sign up free → **New Project**.
2. Wait for it to finish provisioning (~2 min).
3. **New project:** go to **SQL Editor** → paste the entire contents of `supabase/schema.sql` → **Run**.
   This creates all tables, security rules, and the `media` storage bucket.
   **Already ran schema.sql before?** Don't re-run the whole file (the `create policy` lines aren't
   safe to repeat) — instead run each new migration file once, in order:
   `supabase/migration_business_products.sql`, then `supabase/migration_likes_and_blog.sql`,
   then `supabase/migration_notifications.sql`.
4. Go to **Project Settings → API**. Copy:
   - `Project URL` → paste into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret, never expose in the browser)
5. Go to **Authentication → Providers** → make sure **Email** is enabled.
6. Go to **Authentication → Email Templates** → this is where signup verification and password-reset emails are already configured for you, free, out of the box — no separate email service needed. (For higher sending volume later, you can switch to [Resend.com](https://resend.com), also free tier.)
7. Go to **Authentication → URL Configuration** → set **Site URL** to your future live URL (you'll update this after deploying, e.g. `https://samistintech.vercel.app`).

## 3. Run locally

```bash
npm run dev
```

Open `http://localhost:3000` — sign up with a real email, check your inbox, click verify, then log in.

## 4. Test before publishing

- Sign up → confirm verification email arrives → click it.
- Try logging in with a wrong password (should be rejected).
- Log in correctly.
- Create a post with text, an image, a background color, and a link — confirm it shows in the Home feed.
- Post from Marketplace, Tech Trends, Business Trends, Blog, and Reels — confirm each stays in its own page.
- Try uploading a reel longer than 60 minutes (should be blocked).
- Open the 3-dot menu on a post and test Share / Copy / Download.
- Open Chat, pick a contact, send a message — confirm it appears instantly.
- Add a Story and confirm it appears at the top of Home.
- Like and comment on a post from a second test account, then log back into the first account and confirm the notification bell shows a badge and the `/notifications` page lists it.
- Log out from Settings.

Optional automated tests:
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
npx jest --init
```

## 5. Push it to GitHub (step by step)

**a. Create the empty repository on GitHub first:**
1. Go to [github.com](https://github.com) → log in (or sign up free).
2. Click the **+** in the top-right → **New repository**.
3. Name it `samistintech`. Leave it **Public** (or Private if you prefer — both work with Vercel's free tier).
4. Do **not** check "Add a README" — you already have one. Click **Create repository**.
5. GitHub will show you a page with a URL like `https://github.com/YOUR_USERNAME/samistintech.git` — copy it.

**b. Push your local project to it:**
```bash
cd samistintech
git init
git add .
git commit -m "Initial commit: SamistInTech"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/samistintech.git
git push -u origin main
```
If it asks you to log in, use your GitHub username and a **Personal Access Token** as the password (GitHub → Settings → Developer settings → Personal access tokens → generate one with "repo" scope) — GitHub stopped accepting plain passwords for this a while back.

**c. Confirm it worked:** refresh your GitHub repo page in the browser — you should see all your files (`app/`, `components/`, `README.md`, etc.). `.env.local` should **not** appear (it's excluded by `.gitignore` on purpose, so your secret keys never reach GitHub).

## 6. Deploy live on Vercel (step by step) — anyone on the internet can then use it

1. Go to [vercel.com](https://vercel.com) → **Sign Up** → choose **Continue with GitHub** so the two are linked.
2. On your Vercel dashboard, click **Add New… → Project**.
3. Under "Import Git Repository," find `samistintech` and click **Import**.
4. Vercel auto-detects it's a Next.js app — leave the build settings on default.
5. Open **Environment Variables** and add exactly these three (same values as your `.env.local`):
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service role key |
6. Click **Deploy**. Vercel installs dependencies and builds the app — this takes about 1–2 minutes. Watch the build log; if it fails, the error is almost always a missing/misspelled environment variable.
7. When it finishes, Vercel shows a live link like `https://samistintech.vercel.app` (or `-yourname.vercel.app` if the name is taken) with a screenshot preview. Click it — your site is now public, on HTTPS, reachable from any device, anywhere in the world.

**d. One important follow-up step — reconnect Supabase to your live URL:**
1. In Supabase, go to **Authentication → URL Configuration**.
2. Set **Site URL** to your real Vercel URL (e.g. `https://samistintech.vercel.app`).
3. Under **Redirect URLs**, add the same URL (and `https://samistintech.vercel.app/**` to cover subpaths).
   Skipping this step means email verification and password-reset links will try to send people back to `localhost`, which won't work for anyone but you.

**e. Confirm it's really public:** open the Vercel URL on your phone using mobile data (not wifi, so you know it's not just your home network), or send the link to a friend and have them sign up. If they can create an account and post, it's live for the internet.

**f. Ongoing updates:** every time you run `git push` on the `main` branch, Vercel automatically rebuilds and redeploys within a minute or two — no manual redeploy step, ever.

**g. Optional custom domain:** buy one (e.g. `samistintech.com`, roughly $10–15/year from a registrar like Namecheap or Google Domains) → in Vercel go to your project → **Settings → Domains** → add it and follow the DNS instructions shown. Not required — the free `.vercel.app` address is already permanent and public.

---

## Notes on scaling this further

- **Email notifications** (in addition to the in-app bell) aren't set up — Supabase can trigger a Postgres function on new `notifications` rows that calls an email API like Resend, if you want people to be notified even when they're not on the site.
- **Blog content is rendered as raw HTML** (`dangerouslySetInnerHTML`) so formatting from the editor shows correctly. It's written by the logged-in author only right now, but before opening this to many untrusted authors in production, sanitize `body_html` (e.g. with `dompurify`) before saving or rendering it, to prevent malicious script injection.
- **Video length limits** (60 min reels / 30 min business videos) are checked in the browser before upload; for a production app you'd also verify this server-side (e.g. a Supabase Edge Function) since client-side checks can be bypassed.
- **Storage limits**: Supabase's free tier gives 1GB storage + 2GB bandwidth/month — fine for testing, but for lots of video traffic, add [Cloudinary](https://cloudinary.com) (25GB free) for media instead of Supabase Storage.
