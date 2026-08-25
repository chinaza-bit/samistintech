-- Run this ONLY if you already ran schema.sql before and are now adding
-- Likes + the long-form Blog editor. New projects: just run schema.sql,
-- it already includes this.

create table if not exists likes (
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (post_id, user_id)
);

create table if not exists blog_posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references profiles(id) on delete cascade,
  title text not null,
  cover_image_url text,
  body_html text not null,
  created_at timestamp with time zone default now()
);

alter table likes enable row level security;
alter table blog_posts enable row level security;

create policy "Anyone can view likes" on likes for select using (true);
create policy "Users can like posts" on likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike posts" on likes for delete using (auth.uid() = user_id);

create policy "Anyone can view blog posts" on blog_posts for select using (true);
create policy "Authors can create blog posts" on blog_posts for insert with check (auth.uid() = author_id);
create policy "Authors can update their blog posts" on blog_posts for update using (auth.uid() = author_id);
create policy "Authors can delete their blog posts" on blog_posts for delete using (auth.uid() = author_id);
