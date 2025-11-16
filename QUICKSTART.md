# Quick Start Guide

Get ExchAInge running in 5 minutes.

## Step 1: Configure Environment

```bash
cp .env.example .env
nano .env
```

Fill in these required values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_PRIVY_APP_ID`
- `NEXT_PUBLIC_PRIVY_CLIENT_ID`
- `PRIVY_APP_SECRET`
- `NEXT_PUBLIC_SOLANA_RPC_URL`

## Step 2: Deploy

```bash
./deploy.sh
```

Wait 2-3 minutes for build to complete.

## Step 3: Verify

```bash
docker compose ps
```

All services should show "healthy" status.

## Step 4: Access

Open http://localhost in your browser.

## Common Issues

**Build fails**: Check that .env file exists and has all required variables.

**Services unhealthy**: Run `./logs.sh backend` or `./logs.sh frontend` to see errors.

**Port conflicts**: Stop conflicting services on ports 80, 3000, 4000.

## Next Steps

- Review full README.md for production deployment
- Set up SSL certificates for HTTPS
- Configure domain DNS
- Enable monitoring

## Getting Help

```bash
# View all logs
./logs.sh

# View specific service logs
./logs.sh backend
./logs.sh frontend
./logs.sh nginx

# Check service health
docker compose ps

# Restart everything
docker compose restart
```
