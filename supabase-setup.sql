create table if not exists circles (
  id           uuid primary key default gen_random_uuid(),
  x            real not null,
  y            real not null,
  color        text not null,
  media_type   text not null,
  media_url    text,
  text_content text,
  created_at   timestamptz not null default now()
);

alter table circles enable row level security;

create policy "anyone can read circles"
  on circles for select using (true);

create policy "anyone can add circles"
  on circles for insert with check (true);

alter publication supabase_realtime add table circles;

create policy "anyone can upload media"
  on storage.objects for insert
  with check (bucket_id = 'media');

create policy "anyone can read media"
  on storage.objects for select
  using (bucket_id = 'media');
