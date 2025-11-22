# Backend API Setup

Your public frontend needs to call this private backend. Here's how it works:

## The Setup

**Public frontend repo** → calls → **This backend** (stays private)

- Frontend shows UI, this backend does the heavy lifting
- Your secret sauce (AI verification, blockchain stuff) stays hidden here
- They only get an API URL: `https://api.exchainge.io`

## What I Built

**1. CORS middleware** (`src/middleware.ts`)
- Lets the public frontend make requests without CORS errors
- Only allows: `exchainge.io`, `*.vercel.app`, localhost

**2. Deployment configs**
- `Dockerfile` - production build with Bun
- `railway.json` - deploy to Railway (recommended, super easy)
- `fly.toml` - alternative: deploy to Fly.io

**3. Updated `.env.template`** with Redis, CORS settings

**4. Updated `next.config.ts`** with standalone output for Docker

## How to Deploy

**Railway (easiest):**
```bash
npm i -g @railway/cli
railway login
cd packages/webapp
railway init
railway up
```

Then set your env vars in Railway dashboard and add custom domain `api.exchainge.io`.

**Local testing:**
```bash
bun run dev  # Runs at localhost:3000
```

Frontend sets: `NEXT_PUBLIC_API_URL=http://localhost:3000`

## Endpoints Your Frontend Can Use

**Public (no auth):**
- `GET /api/datasets` - list datasets
- `GET /api/health` - health check

**Requires Privy token:**
- `POST /api/datasets` - create dataset
- `GET /api/datasets/:id` - get one dataset
- `PATCH /api/datasets/:id` - update dataset
- `DELETE /api/datasets/:id` - delete dataset
- `POST /api/upload` - upload files
- `GET /api/datasets/:id/download` - download (checks license)

**Auth header:**
```typescript
Authorization: Bearer <privy-token>
```

**Rate limits:**
- 60 req/min for reads
- 30 req/min for writes

## What Frontend Needs

Just give them:
1. **API URL** after you deploy (e.g., `https://api.exchainge.io`)
2. They add: `NEXT_PUBLIC_API_URL=https://api.exchainge.io` to their `.env`
3. Done. They call your endpoints, you handle everything else.

They do **NOT** need:
- Access to this repo
- Supabase credentials
- Privy secrets
- Database access

## TypeScript Types for Frontend

Tell them to create this in their repo:

```typescript
// lib/types/api.ts
export interface Dataset {
  id: string;
  title: string;
  description: string;
  category: string;
  priceUsd: string;
  sizeBytes: number;
  sizeFormatted: string;
  tags: string[];
  thumbnailUrl: string | null;
  status: "draft" | "pending" | "live" | "rejected" | "archived";
  verificationScore: number | null;
  createdAt: string;
  views: number;
  sales: number;
}

// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = {
  datasets: {
    list: () => fetch(`${API_URL}/api/datasets`).then(r => r.json()),
    get: (id: string, token: string) =>
      fetch(`${API_URL}/api/datasets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()),
  }
};
```

## Security Built-In

- ✅ CORS only allows known domains
- ✅ Rate limiting (Redis-based)
- ✅ File validation (type + size checks)
- ✅ Download auth (license verification)
- ✅ Payment idempotency (no double charges)
- ✅ Auto file cleanup

## Test It Works

After deploying:
```bash
curl https://api.exchainge.io/api/health
# Should return: {"status":"ok","timestamp":"..."}

curl https://api.exchainge.io/api/datasets?limit=5
# Should return datasets list
```

From frontend browser console:
```javascript
fetch('https://api.exchainge.io/api/datasets')
  .then(r => r.json())
  .then(d => console.log(d))
// Should work, no CORS errors
```

## Branch Strategy

You asked about branches - you **don't need to merge anything**. Just:
1. Deploy this backend from whatever branch you want
2. Frontend calls the deployed URL
3. Repos stay completely separate

No downloading repos, no branch merging. Just HTTP calls over the internet.

## Costs

**Free tier is enough for MVP:**
- Railway: $5/month credit (free)
- Supabase: Free tier
- Upstash Redis: Free tier
- Total: $0/month

Upgrade when you hit real traffic (\>10k req/day).

---

That's it. Your secret sauce stays private, frontend gets a nice API to work with.
