-- Seed Data for The Mystery of the Moonlight Garden

-- 1. Insert mock users into Supabase auth.users table
-- This automatically fires the 'on_auth_user_created' trigger, which inserts into public.profiles!
INSERT INTO auth.users (
  id, 
  instance_id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  raw_app_meta_data, 
  raw_user_meta_data, 
  aud, 
  role, 
  created_at, 
  updated_at
)
VALUES 
  (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 
    '00000000-0000-0000-0000-000000000000', 
    'ada@science.org', 
    crypt('password123', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name": "Detective Ada"}', 
    'authenticated', 
    'authenticated', 
    now(), 
    now()
  ),
  (
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 
    '00000000-0000-0000-0000-000000000000', 
    'isaac@gravity.edu', 
    crypt('password123', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name": "Detective Isaac"}', 
    'authenticated', 
    'authenticated', 
    now(), 
    now()
  ),
  (
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 
    '00000000-0000-0000-0000-000000000000', 
    'marie@curie.fr', 
    crypt('password123', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name": "Detective Marie"}', 
    'authenticated', 
    'authenticated', 
    now(), 
    now()
  ),
  (
    'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 
    '00000000-0000-0000-0000-000000000000', 
    'albert@relativity.net', 
    crypt('password123', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name": "Detective Albert"}', 
    'authenticated', 
    'authenticated', 
    now(), 
    now()
  )
ON CONFLICT (id) DO NOTHING;


-- 2. Insert corresponding leaderboard scores
INSERT INTO public.leaderboard (user_id, total_score, last_updated)
VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 850, now()),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 720, now()),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 600, now()),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 450, now())
ON CONFLICT (user_id) DO NOTHING;


-- 3. Insert mock earned badges
INSERT INTO public.badges (user_id, badge_name, earned_at)
VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Light Explorer', now()),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Reflection Expert', now()),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Shadow Master', now()),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Garden Savior', now()),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Light Detective Master', now()),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Light Explorer', now()),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Reflection Expert', now()),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Shadow Master', now()),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Light Explorer', now()),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Reflection Expert', now())
ON CONFLICT DO NOTHING;
