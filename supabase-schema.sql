-- ==============================================================================
-- HYPE FINDER - SUPABASE DATABASE SCHEMA & AUTHENTICATION MIGRATION
-- Run this in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Create profiles table linked to Supabase Auth users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  credits integer default 90 not null check (credits >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create clips table for saving generated viral moments
create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  source_url text,
  duration real,
  hype_score real,
  video_url text,
  clip_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS) on both tables
alter table public.profiles enable row level security;
alter table public.clips enable row level security;

-- 4. Profiles RLS Policies: users can only view and edit their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. Clips RLS Policies: users can only view, insert, and delete their own clips
drop policy if exists "Users can view own clips" on public.clips;
create policy "Users can view own clips"
  on public.clips for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own clips" on public.clips;
create policy "Users can create own clips"
  on public.clips for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own clips" on public.clips;
create policy "Users can delete own clips"
  on public.clips for delete
  using (auth.uid() = user_id);

-- 6. Function and Trigger: automatically create a profile with 90 FREE credits on sign up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, credits)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    90
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Helper Index for fast query of user clips
create index if not exists idx_clips_user_id on public.clips(user_id);
