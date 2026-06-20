# DayTrack — Setup Guide

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New query**, paste the contents of `supabase-schema.sql`, and run it
3. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. In Supabase **Authentication → Providers**, confirm Email is enabled

## 2. Groq API

1. Get a free API key at [console.groq.com](https://console.groq.com)
2. Copy the key → `GROQ_API_KEY`

## 3. Local development

```bash
# Copy env template
cp .env.local.example .env.local

# Fill in all 4 env vars in .env.local, then:
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → create account → start tracking.

## 4. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

When prompted, add these environment variables in the Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`

## Features

| Feature | How |
|---------|-----|
| Create targets | `/targets` → New target |
| Log hours | Day view → Log button → add increments |
| Tally marks | Displayed automatically per hour logged |
| Streaks | Shown as 🔥 badge after 3+ consecutive days |
| Weekly overview | `/week` → colored heat map grid |
| AI summary | `/summary` → Generate summary (uses Groq) |
| Dark mode | Sidebar toggle |
| Export data | Sidebar → Export data (downloads JSON) |
