create table if not exists memories (
  id           uuid primary key default gen_random_uuid(),
  x            real not null,
  y            real not null,
  color        text not null,
  media_type   text not null,
  media_url    text,
  text_content text,
  title        text,
  author       text,
  hidden       boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table memories add column if not exists hidden boolean not null default false;

alter table memories enable row level security;

drop policy if exists "anyone can read memories" on memories;

create policy "anyone can read memories"
  on memories for select using (hidden = false);

create policy "anyone can add memories"
  on memories for insert with check (true);

alter publication supabase_realtime add table memories;

create policy "anyone can upload media"
  on storage.objects for insert
  with check (bucket_id = 'media');

create policy "anyone can read media"
  on storage.objects for select
  using (bucket_id = 'media');
