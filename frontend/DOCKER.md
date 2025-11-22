# Docker Setup for Exchainge Frontend

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)

## Quick Start

### 1. Environment Setup

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials.

### 2. Build and Run with Docker Compose

```bash
# Build and start in detached mode
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The frontend will be available at `http://localhost:3000`

### 3. Build Docker Image Only

```bash
# Build the image
docker build -t exchainge-frontend .

# Run the container
docker run -p 3000:3000 --env-file .env.local exchainge-frontend
```

## Production Deployment

### Deploy to VPS

1. Clone the repo on your VPS:
```bash
git clone https://github.com/your-org/exchainge-frontend.git
cd exchainge-frontend
```

2. Set up environment variables:
```bash
cp .env.example .env.local
nano .env.local  # Edit with production values
```

3. Run with Docker Compose:
```bash
docker-compose up -d
```

4. Set up Nginx reverse proxy (optional):
```nginx
server {
    listen 80;
    server_name exchainge.net;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Deploy to Cloud Platforms

#### Fly.io
```bash
fly launch
fly deploy
```

#### Railway
1. Connect your GitHub repo to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

#### Render
1. Create new Web Service
2. Connect GitHub repo
3. Use Docker runtime
4. Add environment variables
5. Deploy

## Docker Commands

```bash
# Rebuild after code changes
docker-compose up --build

# View running containers
docker ps

# View logs
docker-compose logs -f frontend

# Execute commands in container
docker-compose exec frontend sh

# Stop and remove containers
docker-compose down

# Remove volumes as well
docker-compose down -v

# Restart container
docker-compose restart frontend
```

## Troubleshooting

### Container won't start
- Check logs: `docker-compose logs frontend`
- Verify `.env.local` exists and has correct values
- Ensure port 3000 is not already in use

### Build fails
- Clear Docker cache: `docker builder prune`
- Rebuild from scratch: `docker-compose build --no-cache`

### Environment variables not working
- Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
- Rebuild after changing env vars: `docker-compose up --build`

## Architecture

This Dockerfile uses a multi-stage build:
1. **deps**: Install dependencies
2. **builder**: Build the Next.js app
3. **runner**: Run the production server

Benefits:
- Smaller final image (~150MB vs ~1GB)
- More secure (no build tools in production)
- Faster deployments
- Automatic restarts on crashes
