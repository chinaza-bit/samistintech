-- Run this ONLY if you already ran the original schema.sql and are now adding
-- the Business page feature. If this is a brand-new project, just run the
-- full supabase/schema.sql instead — it already includes this table.

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

alter table business_products enable row level security;

create policy "Anyone can view business products" on business_products for select using (true);
create policy "Owners can add their products" on business_products for insert with check (auth.uid() = owner_id);
create policy "Owners can update their products" on business_products for update using (auth.uid() = owner_id);
create policy "Owners can delete their products" on business_products for delete using (auth.uid() = owner_id);
