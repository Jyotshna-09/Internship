-- Supabase Database Schema for The Mystery of the Moonlight Garden

-- 1. Create profiles table linked to auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Allow users to insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Trigger to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. Create progress table
create table public.progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  current_level integer default 1 not null,
  completed_levels jsonb default '[]'::jsonb not null,
  progress_percentage integer default 0 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on progress
alter table public.progress enable row level security;

-- Progress Policies
create policy "Allow users to read their own progress" on public.progress
  for select using (auth.uid() = user_id);

create policy "Allow users to update their own progress" on public.progress
  for update using (auth.uid() = user_id);

create policy "Allow users to insert their own progress" on public.progress
  for insert with check (auth.uid() = user_id);


-- 3. Create quiz_results table
create table public.quiz_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  chapter integer not null,
  score integer not null,
  attempts integer default 1 not null,
  time_taken integer, -- in seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on quiz_results
alter table public.quiz_results enable row level security;

-- Quiz Results Policies
create policy "Allow users to read their own quiz results" on public.quiz_results
  for select using (auth.uid() = user_id);

create policy "Allow users to insert their own quiz results" on public.quiz_results
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own quiz results" on public.quiz_results
  for update using (auth.uid() = user_id);


-- 4. Create badges table
create table public.badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_name text not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, badge_name)
);

-- Enable RLS on badges
alter table public.badges enable row level security;

-- Badges Policies
create policy "Allow public read access to badges" on public.badges
  for select using (true);

create policy "Allow users to insert their own badges" on public.badges
  for insert with check (auth.uid() = user_id);


-- 5. Create leaderboard table
create table public.leaderboard (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  total_score integer default 0 not null,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on leaderboard
alter table public.leaderboard enable row level security;

-- Leaderboard Policies
create policy "Allow public read access to leaderboard" on public.leaderboard
  for select using (true);

create policy "Allow users to insert/update their own leaderboard score" on public.leaderboard
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own leaderboard score" on public.leaderboard
  for update using (auth.uid() = user_id);


-- 6. Create certificates table
create table public.certificates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  certificate_url text not null,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on certificates
alter table public.certificates enable row level security;

-- Certificates Policies
create policy "Allow users to read their own certificates" on public.certificates
  for select using (auth.uid() = user_id);

create policy "Allow users to insert their own certificates" on public.certificates
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own certificates" on public.certificates
  for update using (auth.uid() = user_id);
