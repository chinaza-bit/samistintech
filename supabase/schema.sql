-- ============================================================
-- SamistInTech — full database schema for Supabase
-- Run this once in Supabase → SQL Editor → New query → Run
-- ============================================================

-- Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  account_type text check (account_type in ('personal','blogger','business')) default 'personal',
  business_name text,
  business_links text,
  created_at timestamp with time zone default now()
);

-- Follows (many-to-many)
create table if not exists follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (follower_id, following_id)
);

-- Posts (feed, marketplace, tech_trends, business_trends, blog, reel)
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references profiles(id) on delete cascade,
  category text check (category in ('feed','marketplace','tech_trends','business_trends','blog','reel')) default 'feed',
  text_content text,
  text_size text default 'text-lg',
  text_color text default '#111827',
  bg_color text default '#ffffff',
  bg_image_url text,
  image_url text,
  video_url text,
  music_url text,
  link_url text,
  created_at timestamp with time zone default now()
);

-- Comments
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Likes (one like per user per post)
create table if not exists likes (
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (post_id, user_id)
);

-- Long-form blog posts (separate from short posts — title, cover image, rich body)
create table if not exists blog_posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references profiles(id) on delete cascade,
  title text not null,
  cover_image_url text,
  body_html text not null,
  created_at timestamp with time zone default now()
);

-- Stories (auto-expire after 24h — filter by expires_at in queries)
create table if not exists stories (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references profiles(id) on delete cascade,
  media_url text not null,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '24 hours')
);

-- Business products (feature: Business page — products, details, links, videos up to 30 min)
create table if not exists business_products (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  price text,
  link_url text,
  image_url text,
  video_url text,
  created_at timestamp with time zone default now()
);

-- Direct messages (chat)
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Notifications (likes, comments, follows, messages)
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete cascade,
  type text check (type in ('like','comment','follow','message')) not null,
  post_id uuid references posts(id) on delete cascade,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- Row Level Security — every table locked down by default,
-- then opened up with precise policies.
-- ============================================================

alter table profiles enable row level security;
alter table follows enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table stories enable row level security;
alter table messages enable row level security;
alter table business_products enable row level security;
alter table likes enable row level security;
alter table blog_posts enable row level security;
alter table notifications enable row level security;

-- Profiles: anyone can read, only the owner can edit
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- Posts: anyone can read, only the author can insert/update/delete their own
create policy "Anyone can view posts" on posts for select using (true);
create policy "Users can create their own posts" on posts for insert with check (auth.uid() = author_id);
create policy "Users can update their own posts" on posts for update using (auth.uid() = author_id);
create policy "Users can delete their own posts" on posts for delete using (auth.uid() = author_id);

-- Comments
create policy "Anyone can view comments" on comments for select using (true);
create policy "Users can add comments" on comments for insert with check (auth.uid() = author_id);

-- Follows
create policy "Anyone can view follows" on follows for select using (true);
create policy "Users can follow others" on follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on follows for delete using (auth.uid() = follower_id);

-- Stories
create policy "Anyone can view active stories" on stories for select using (true);
create policy "Users can add their own stories" on stories for insert with check (auth.uid() = author_id);

-- Messages: only sender or receiver can read/write their own conversation
create policy "Users can view their own conversations" on messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages" on messages
  for insert with check (auth.uid() = sender_id);

-- Business products: anyone can view, only the owning business can manage
create policy "Anyone can view business products" on business_products for select using (true);
create policy "Owners can add their products" on business_products for insert with check (auth.uid() = owner_id);
create policy "Owners can update their products" on business_products for update using (auth.uid() = owner_id);
create policy "Owners can delete their products" on business_products for delete using (auth.uid() = owner_id);

-- Likes: anyone can view like counts, users can only like/unlike as themselves
create policy "Anyone can view likes" on likes for select using (true);
create policy "Users can like posts" on likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike posts" on likes for delete using (auth.uid() = user_id);

-- Blog posts: anyone can read, only the author can manage their own
create policy "Anyone can view blog posts" on blog_posts for select using (true);
create policy "Authors can create blog posts" on blog_posts for insert with check (auth.uid() = author_id);
create policy "Authors can update their blog posts" on blog_posts for update using (auth.uid() = author_id);
create policy "Authors can delete their blog posts" on blog_posts for delete using (auth.uid() = author_id);

-- Notifications: recipients can only see/manage their own; anyone can create one
-- for someone else as long as they are honestly recorded as the actor.
create policy "Recipients can view their own notifications" on notifications
  for select using (auth.uid() = recipient_id);
create policy "Users can create notifications as themselves" on notifications
  for insert with check (auth.uid() = actor_id);
create policy "Recipients can mark their notifications read" on notifications
  for update using (auth.uid() = recipient_id);

-- ============================================================
-- Storage bucket for images/videos/audio/stories
-- Run in Supabase → Storage → create bucket named "media" (public)
-- OR run this:
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public read access to media" on storage.objects
  for select using (bucket_id = 'media');
create policy "Authenticated users can upload media" on storage.objects
  for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');
