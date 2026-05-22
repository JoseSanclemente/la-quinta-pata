-- ============================================================
--  Run this ONCE in Supabase -> SQL Editor -> New query -> Run
-- ============================================================

-- 1. Table that stores every circle
create table if not exists circles (
  id           uuid primary key default gen_random_uuid(),
  x            real not null,            -- horizontal position, 0-100 (% of map)
  y            real not null,            -- vertical position, 0-100 (% of map)
  color        text not null,
  media_type   text not null,           -- 'image' | 'video' | 'text'
  media_url    text,                     -- public URL when image/video
  text_content text,                     -- the text when media_type = 'text'
  created_at   timestamptz not null default now()
);

-- 2. Turn on Row Level Security
alter table circles enable row level security;

-- 3. OPEN policies: anyone can read and add circles (public toy project).
--    Remove / tighten these later if you add accounts.
create policy "anyone can read circles"
  on circles for select using (true);

create policy "anyone can add circles"
  on circles for insert with check (true);

-- 4. Let new INSERTs stream to all visitors (realtime)
alter publication supabase_realtime add table circles;

-- ============================================================
--  STORAGE: create a PUBLIC bucket named  media
--  (do this in Supabase -> Storage -> New bucket -> name "media" -> Public)
--
--  Then run the storage policies below so the website can upload files:
-- ============================================================
create policy "anyone can upload media"
  on storage.objects for insert
  with check (bucket_id = 'media');

create policy "anyone can read media"
  on storage.objects for select
  using (bucket_id = 'media');
