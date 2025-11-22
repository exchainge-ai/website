# ExchAInge Docker Deployment

Docker Compose setup for running ExchAInge frontend and backend with nginx reverse proxy.

## Quick Start

```bash
git clone --recurse-submodules https://github.com/exchainge-ai/website
cd website
cp .env.example .env
# Edit .env with your credentials
docker compose up -d
```

If already cloned: `git submodule update --init --recursive`

Access at http://localhost

## Prerequisites

- Docker and Docker Compose installed
- Supabase account and credentials
- Privy account and credentials
- Upstash Redis account
- Cloudflare R2 bucket
- Sui testnet RPC or SOL tesnter RPC.

## Environment Setup

Copy .env.example to .env and fill in these required variables.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
NEXT_PUBLIC_APP_URL=http://localhost
NEXT_PUBLIC_API_BASE_URL=http://localhost/api
NEXT_PUBLIC_PRIVY_APP_ID=your_id
NEXT_PUBLIC_PRIVY_CLIENT_ID=your_id
PRIVY_APP_SECRET=your_secret
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_BUCKET_NAME=datasets
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WALLET_PRIVATE_KEY=your_key
SOLANA_DATASET_PRICE_SOL=0.1
```

## Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Rebuild after changes
docker compose build
docker compose up -d

# Check status
docker compose ps
```

## Architecture

```
Browser → Nginx (port 80) → Frontend (port 3000 internal)
                          → Backend API (port 4000 internal)
```

Nginx handles routing. Frontend at / and backend API at /api.

## Endpoints

- Frontend: http://localhost
- Backend API: http://localhost/api
- Health check: http://localhost/api/health

## Production Deployment

On your VPS:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone and setup
git clone <your-repo> exchainge
cd exchainge
cp .env.example .env
nano .env  # Add production credentials

# Update URLs for production
NEXT_PUBLIC_APP_URL=https://exchainge.net
NEXT_PUBLIC_API_BASE_URL=https://exchainge.net/api

# Deploy
docker compose up -d
```

## SSL Setup

```bash
# Install certbot
apt-get install certbot

# Get certificate
certbot certonly --standalone -d exchainge.net

# Copy to project
mkdir -p ssl
cp /etc/letsencrypt/live/exchainge.net/fullchain.pem ssl/
cp /etc/letsencrypt/live/exchainge.net/privkey.pem ssl/

# Update nginx.conf to enable HTTPS block
nano nginx.conf

# Restart
docker compose restart nginx
```

## Troubleshooting

### Services won't start

```bash
docker compose logs
# Check .env file has all variables
./verify-env.sh
```

### Marketplace not loading

Check NEXT_PUBLIC_API_BASE_URL is set to http://localhost/api not http://backend:4000.

### Port conflicts

```bash
lsof -i :80
# Kill process using port 80
```

## File Structure

```
exchainge/
├── backend/              # Backend repo
├── frontend/             # Frontend repo
├── docker-compose.yml    # Service config
├── nginx.conf            # Proxy config
├── .env                  # Credentials
├── .env.example          # Template
└── verify-env.sh         # Validation script
```

## Repositories

- Frontend: https://github.com/exchainge-ai/frontend
- Backend: https://github.com/exchainge-ai/backend
- Solana Program: https://github.com/exchainge-ai/exchainge-program
- Mainnet: https://explorer.solana.com/address/3tK3ejf1JWJPei5Nh19Wj3GZtvZ6KoCBfYTnPbhVAHk1
