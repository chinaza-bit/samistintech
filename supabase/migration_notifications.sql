-- Run this ONLY if you already ran schema.sql before and are now adding
-- Notifications. New projects: just run schema.sql, it already includes this.

create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete cascade,
  type text check (type in ('like','comment','follow','message')) not null,
  post_id uuid references posts(id) on delete cascade,
  read boolean default false,
  created_at timestamp with time zone default now()
);

alter table notifications enable row level security;

create policy "Recipients can view their own notifications" on notifications
  for select using (auth.uid() = recipient_id);
create policy "Users can create notifications as themselves" on notifications
  for insert with check (auth.uid() = actor_id);
create policy "Recipients can mark their notifications read" on notifications
  for update using (auth.uid() = recipient_id);
