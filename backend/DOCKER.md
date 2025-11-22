# ExchAInge Backend - Docker Deployment

Production deployment guide for the ExchAInge backend API using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2+
- `.env` file with required environment variables

## Quick Start

### Clone and Setup

```bash
git clone https://github.com/exchainge-ai/exchainge-backend.git
cd exchainge-backend
cp .env.example .env
# Edit .env with your actual values
```

### Environment Variables

Required variables in `.env`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:4000
PORT=4000

# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Agent (optional)
AGENT_WALLET_PRIVATE_KEY=your_key
AGENT_ACCESS_TOKEN=your_token
AGENT_MAX_PRICE=1600
```

### Build and Run

```bash
docker compose up -d --build
```

The API will be available at `http://localhost:4000`.

## Docker Commands

### Basic Operations

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f backend

# Restart
docker compose restart backend

# Stop
docker compose stop

# Stop and remove containers
docker compose down

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Debugging

```bash
# Check container status
docker compose ps

# View recent logs
docker compose logs --tail=50 backend

# Execute command in container
docker compose exec backend bun --version

# Inspect container
docker inspect exchainge-backend
```

## Production Deployment

### VPS Deployment (DigitalOcean, Linode, etc.)

1. Install Docker on your VPS:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y
```

2. Clone and configure:

```bash
git clone https://github.com/exchainge-ai/exchainge-backend.git
cd exchainge-backend
nano .env  # Add your production variables
```

3. Run the stack:

```bash
docker compose up -d --build
```

4. Set up Nginx reverse proxy:

```nginx
# /etc/nginx/sites-available/exchainge-backend
server {
    listen 80;
    server_name api.exchainge.net;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/exchainge-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

5. SSL with Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.exchainge.net
```

### Railway Deployment

Railway is already configured via `Dockerfile` and `railway.json`:

```bash
npm i -g @railway/cli
railway login
railway up
```

### Fly.io Deployment

```bash
curl -L https://fly.io/install.sh | sh
fly launch
fly deploy
```

## Docker Compose Configuration

### Enable Local PostgreSQL

Uncomment the `db` service in `docker-compose.yml`:

```yaml
db:
  image: postgres:15-alpine
  container_name: exchainge-db
  restart: unless-stopped
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: exchainge
  volumes:
    - postgres_data:/var/lib/postgresql/data
  ports:
    - "5432:5432"
```

Update `.env`:

```bash
DATABASE_URL=postgresql://postgres:password@db:5432/exchainge
```

### Enable Redis Cache

Uncomment the `redis` service in `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: exchainge-redis
  restart: unless-stopped
  ports:
    - "6379:6379"
```

## Health Checks

The container includes built-in health monitoring:

```bash
# Check health status
docker inspect exchainge-backend --format='{{json .State.Health}}'

# Continuous monitoring
watch -n 5 'docker inspect exchainge-backend --format="{{.State.Health.Status}}"'
```

Health endpoint:

```bash
curl http://localhost:4000/api/health
```

## Troubleshooting

### Container won't start

```bash
# Check logs for errors
docker compose logs backend

# Rebuild without cache
docker compose build --no-cache backend
docker compose up -d
```

### Port already in use

```bash
# Find process using port 4000
lsof -i :4000

# Kill the process or change PORT in .env
```

### Build fails

```bash
# Clear Docker cache
docker system prune -a --volumes

# Ensure .env is properly configured
cat .env
```

### Container keeps restarting

```bash
# Check container status
docker compose ps

# View detailed logs
docker compose logs --tail=100 backend

# Check health status
docker inspect exchainge-backend --format='{{json .State.Health}}'
```

## Performance

### Image Optimization

The Dockerfile uses multi-stage builds to:
- Reduce final image size (~200MB vs 1GB+)
- Exclude development dependencies
- Enable layer caching for faster rebuilds

### Resource Limits

Add resource constraints in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
```

## Security

Best practices:
- Never commit `.env` files
- Use Docker secrets for production credentials
- Container runs as non-root user (uid 1001)
- Keep base images updated: `docker compose pull`
- Scan for vulnerabilities: `docker scan exchainge-backend`

## Architecture

This is a Next.js monorepo with API routes:
- Frontend and backend served from same container
- API routes under `/api/*`
- Next.js handles routing and serving
- Runs on port 4000 (configurable via PORT env var)

## Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Bun Docker Guide](https://bun.sh/docs/bundler/docker)
- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)
