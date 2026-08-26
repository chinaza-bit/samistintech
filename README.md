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

#Developed by Ezenwa Chinaza Samuel
