# Setup Guide

Get ExchAInge running in under 10 minutes.

## Prerequisites

- Bun installed: `curl -fsSL https://bun.sh/install | bash`
- Accounts (all have free tiers):
  - Supabase
  - Upstash Redis
  - Privy

## Step 1: Clone and Install

```bash
git clone <your-repo>
cd exchainge
bun install
```

## Step 2: Set Up Supabase

**Create project:**
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Pick a name, password, region
4. Wait ~2min for provisioning

**Get credentials:**
1. Project Settings → API
2. Copy `Project URL` and `anon public` key
3. Copy `service_role` key (click "Reveal")

**Run migrations:**
```bash
cd packages/supabase
supabase link --project-ref <your-project-ref>
supabase db push
```

Your project ref is in the URL: `https://supabase.com/dashboard/project/<project-ref>`

## Step 3: Set Up Redis

**Create database:**
1. Go to https://console.upstash.com
2. Click "Create Database"
3. Name it "exchainge"
4. Region: US East (or closest to your Supabase)
5. Click "Create"

**Get credentials:**
1. Click on your database
2. Go to "REST API" tab
3. Copy `UPSTASH_REDIS_REST_URL`
4. Copy `UPSTASH_REDIS_REST_TOKEN`

## Step 4: Set Up Privy

**Create app:**
1. Go to https://dashboard.privy.io
2. Create account / login
3. Click "Create New App"
4. Name it "ExchAInge"

**Get credentials:**
1. App Settings
2. Copy `App ID`
3. Copy `App Secret` (reveal it first)

**Configure wallet support:**
1. Go to "Login Methods"
2. Enable: Email, Wallet (Ethereum)
3. Save

## Step 5: Environment Variables

Create `packages/webapp/.env.local`:

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=cmxxxxxxxxxxxxx
PRIVY_APP_SECRET=xxxxxxxxxxxxx

# Redis
UPSTASH_REDIS_REST_URL=https://us1-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxxx
```

## Step 6: Run It

```bash
bun run mvp
```

Open http://localhost:3000

**Verify it works:**
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "services": {
    "database": {"status": "healthy"},
    "redis": {"status": "healthy"}
  }
}
```

## Troubleshooting

**Supabase connection fails:**
- Check your service role key is correct
- Verify project isn't paused (happens after 7 days inactivity on free tier)
- Check migrations ran: `supabase db pull` should show tables

**Redis connection fails:**
- Double-check REST URL and token (easy to mix them up)
- App still works without Redis, just slower
- Verify at https://console.upstash.com → Data Browser

**Privy auth doesn't work:**
- Add http://localhost:3000 to allowed origins in Privy dashboard
- Check App ID and Secret are in .env.local
- Look in browser console for errors

**Port 3000 in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

## Next Steps

**Make yourself admin:**
```sql
-- In Supabase SQL editor
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

**Upload test dataset:**
1. Sign in at http://localhost:3000
2. Go to /dashboard/upload
3. Upload a file, fill out form
4. Check /datasets to see it appear

**View logs:**
```bash
bun run mvp
# Watch terminal for auth, dataset operations, cache hits/misses
```

## Production Deploy

See [DEPLOY.md](DEPLOY.md) for Vercel/Railway deployment instructions.

## Common Tasks

**Add a migration:**
```bash
cd packages/supabase
supabase migration new add_downloads_count
# Edit the new file in migrations/
supabase db push
```

**Regenerate types:**
```bash
cd packages/supabase
bun run typegen:prod  # From production
# or
bun run typegen:local # From local DB
```

**Clear Redis cache:**
```bash
# In Upstash console → Data Browser → CLI
FLUSHDB
```

**Reset database:**
```bash
cd packages/supabase
supabase db reset  # Destroys all data, reruns migrations
```
