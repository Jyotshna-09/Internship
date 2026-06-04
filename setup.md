# Setup Guide: The Mystery of the Moonlight Garden

This document outlines the steps to set up Supabase backend, database tables, Row Level Security (RLS) rules, storage buckets, realtime features, environment variables, and deployment instructions.

---

## 1. Supabase Project Setup

1. Go to the [Supabase Dashboard](https://supabase.com) and create a new project.
2. Once your project is created, navigate to the **SQL Editor** in the left sidebar.
3. Click **New query**, paste the contents of [supabase_schema.sql](file:///e:/moonlight-garden-quest-main/supabase_schema.sql), and run it. This will create the database tables, RLS policies, and user triggers.
4. Open another **New query**, paste the contents of [seed.sql](file:///e:/moonlight-garden-quest-main/seed.sql), and run it to populate the leaderboard with mock players.

---

## 2. Enable Realtime Leaderboard

To ensure that the leaderboard updates instantly when players earn points or badges:
1. In the Supabase Dashboard, go to **Database** -> **Replication** (under Database Settings).
2. Under **Source**, click the **Publications** toggle for `supabase_realtime` to enable it if not already enabled.
3. Click the table count or edit icon for `supabase_realtime` and enable replication for the following tables:
   - `leaderboard`
   - `profiles`
   - `badges`

---

## 3. Storage Bucket for Certificates

The Certificate system generates PDF files and uploads them to Supabase Storage.
1. In the Supabase Dashboard, go to **Storage** (left sidebar).
2. Click **New bucket**.
3. Name the bucket `certificates`.
4. Set the bucket to **Public** (so that users can access their generated files easily).
5. Create an RLS policy for the `certificates` bucket:
   - **Insert/Upload**: Enabled for authenticated users (where `auth.uid() = owner`).
   - **Read/Select**: Publicly readable.

---

## 4. Environment Variables

Create a file named `.env` in the root of the workspace with the following content (replace values with your project credentials from **Project Settings** -> **API**):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 5. Local Development

To run the project locally:
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```

## 6. Deployment to Vercel

To deploy this application to Vercel (supporting both static assets and SSR server endpoints):
1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Log into [Vercel](https://vercel.com) and import the repository.
3. Vercel will automatically detect the Vite setup.
4. Under **Environment Variables** in the Vercel project configuration, you MUST add:
   - `NITRO_PRESET` = `vercel` (this tells the Nitro bundler to output Vercel Serverless Functions)
   - `VITE_SUPABASE_URL` = (your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY` = (your Supabase Anon Key)
5. Set the **Build Command** to: `npm run build`
6. Set the **Output Directory** to **DEFAULT** (do **NOT** override this setting; leave the override toggle off/disabled). Nitro compiles the serverless deployment inside `.vercel/output`, and Vercel will automatically detect and process it if the output directory is left at its default value.
7. Click **Deploy**. Vercel will build the frontend assets and automatically deploy the server routes.
