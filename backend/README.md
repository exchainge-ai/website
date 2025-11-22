# ExchAInge

Data marketplace for physical ai datasets. Upload, verify, and license your data.

## Run It

```bash
bun install
bun run mvp
```

Open http://localhost:3000

That's it. The app connects to production Supabase and Redis (already configured in `.env.local`).

## What You Need

**Required:**
- Bun 1.2.18+
- Supabase account (free tier works)
- Upstash Redis account (free tier works)

**Get credentials:**
1. Supabase: https://supabase.com → New Project → Copy API keys
2. Upstash: https://console.upstash.com → Create Database → Copy REST URL/Token
3. Privy: https://dashboard.privy.io → Create App → Copy App ID/Secret

Add them to `packages/webapp/.env.local` (see `.env.local` for template).

## Project Layout

```
exchainge/
├── packages/webapp/          # Next.js app (frontend + API)
│   ├── src/app/              # Pages and API routes
│   ├── src/lib/db/           # Database layer (Supabase/Redis)
│   └── src/lib/server/       # Auth, logging, rate limiting
├── packages/supabase/        # Database migrations
│   └── migrations/           # SQL schema files
└── package.json              # Monorepo root
```

**Key files:**
- `packages/webapp/src/app/api/` - All backend endpoints
- `packages/webapp/src/lib/db/` - Database queries with caching
- `packages/supabase/migrations/001_initial_schema.sql` - Database schema

## How It Works

**Authentication:**
- Privy handles Web3 wallets + email login
- User syncs to our DB via `/api/users/sync`
- JWT verified on every API request

**Data Flow:**
1. User uploads dataset → Creates DB record + stores file in Supabase Storage
2. Dataset goes to verification queue (status: "pending")
3. Admin approves → Status changes to "live"
4. Buyers purchase license → Creates license record + payment entry

**Caching:**
- Redis caches users, datasets, licenses (1hr TTL)
- Auto-invalidates on updates
- Falls back to DB if Redis is down

**Security:**
- RLS enabled on all tables
- Rate limiting (30-60 req/min per endpoint)
- XSS protection via DOMPurify
- Input validation with Zod

## Commands

**Development:**
```bash
bun run mvp          # Run the app
bun run test         # Run tests
bun lint             # Check code style
```

**Database:**
```bash
cd packages/supabase
supabase migration new my_change    # Create migration
supabase db push                    # Apply to production
```

**Production:**
```bash
cd packages/webapp
bun run build        # Build for production
bun run start        # Run production server
```

## API Endpoints

```
GET  /api/health                    # Check services
POST /api/users/sync                # Login/signup
GET  /api/datasets                  # List datasets
POST /api/datasets                  # Create dataset (auth required)
GET  /api/datasets/[id]             # Get dataset details
PATCH/DELETE /api/datasets/[id]     # Update/delete (owner/admin only)
```

Test with:
```bash
curl http://localhost:3000/api/health
```

## Docs

- [SETUP.md](SETUP.md) - Detailed setup instructions
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and data flow
- Database schema: `packages/supabase/migrations/001_initial_schema.sql`

## Stack

- **Runtime:** Bun
- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL via Supabase
- **Cache:** Redis via Upstash
- **Auth:** Privy
- **Storage:** Supabase Storage
- **Styling:** Tailwind CSS 4

## Troubleshooting

**Port already in use:**
```bash
kill -9 $(lsof -ti:3000)  # Kill process on port 3000
bun run mvp
```

**Database connection fails:**
- Check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Verify Supabase project is not paused (free tier auto-pauses after 7 days)

**Redis not working:**
- App still works without Redis (just slower)
- Check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Run `curl http://localhost:3000/api/health` to verify

Need help? Open an issue.
