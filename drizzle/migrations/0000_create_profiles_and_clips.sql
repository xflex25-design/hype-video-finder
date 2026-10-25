create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  credits integer not null default 90 check (credits >= 0),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  source_url text,
  duration real,
  hype_score real,
  video_url text,
  clip_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select, insert, delete on public.clips to authenticated;
grant all on public.clips to service_role;

alter table public.profiles enable row level security;
alter table public.clips enable row level security;

create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can view own clips" on public.clips for select to authenticated using (auth.uid() = user_id);
create policy "Users can create own clips" on public.clips for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own clips" on public.clips for delete to authenticated using (auth.uid() = user_id);

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

create or replace function public.spend_credits(_amount integer)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare remaining integer;
begin
  if _amount is null or _amount < 0 then
    raise exception 'spend_credits requires a non-negative amount';
  end if;
  update public.profiles
     set credits = greatest(0, credits - _amount),
         updated_at = timezone('utc'::text, now())
   where id = auth.uid()
  returning credits into remaining;
  return remaining;
end;
$$;

grant execute on function public.spend_credits(integer) to authenticated;

create index if not exists idx_clips_user_id on public.clips(user_id);