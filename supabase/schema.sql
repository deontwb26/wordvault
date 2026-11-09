-- WordVault database setup.
-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Safe to re-run: it only creates things that don't exist yet.

-- 1. Categories (your own tags, e.g. "Writing")
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null,
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now()
);
-- Category names are unique per user, ignoring upper/lower case.
create unique index if not exists categories_user_name_idx
  on public.categories (user_id, lower(name));

-- 2. Saved words
create table if not exists public.saved_words (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  word           text not null,           -- always stored lowercase
  personal_note  text not null default '',
  saved_at       timestamptz not null default now(),
  unique (user_id, word)
);

-- 3. Link table: which word has which categories (many-to-many).
-- Deleting a category or a word removes its links automatically (cascade),
-- so deleting a category never deletes words.
create table if not exists public.saved_word_categories (
  word_id      uuid not null references public.saved_words on delete cascade,
  category_id  uuid not null references public.categories on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  primary key (word_id, category_id)
);

-- 4. Row Level Security: each signed-in user only sees their own rows.
alter table public.categories            enable row level security;
alter table public.saved_words           enable row level security;
alter table public.saved_word_categories enable row level security;

drop policy if exists "own categories" on public.categories;
create policy "own categories" on public.categories
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own words" on public.saved_words;
create policy "own words" on public.saved_words
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own word links" on public.saved_word_categories;
create policy "own word links" on public.saved_word_categories
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 5. Let signed-in users reach these tables through the API.
grant select, insert, update, delete on public.categories            to authenticated;
grant select, insert, update, delete on public.saved_words           to authenticated;
grant select, insert, update, delete on public.saved_word_categories to authenticated;
