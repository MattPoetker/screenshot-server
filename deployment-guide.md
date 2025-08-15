# Production Deployment Guide

## Overview
This guide covers seamless production deployments with zero-downtime updates for the Screenshot Server.

## Available Deployment Strategies

### 1. Rolling Updates (Recommended for most cases)
- Gradually replaces old containers with new ones
- No downtime during deployment
- Automatic rollback on health check failure

### 2. Blue-Green Deployment (For instant rollback)
- Two identical environments (blue and green)
- Instant traffic switching
- Quick rollback capability

## Health Check Endpoints

- **`/api/health`** - Main health check (checks DB, storage)
- **`/api/ready`** - Readiness probe (checks if app can serve traffic)
- **`/api/live`** - Liveness probe (simple alive check)

## Deployment Commands

### Quick Start

```bash
# Rolling update (default)
./deploy.sh

# Blue-green deployment
./deploy.sh blue-green

# Rollback
./deploy.sh rollback

# Run migrations
./deploy.sh migrate

# Health check
./deploy.sh health
```

### Manual Rolling Update

```bash
# 1. Pull latest changes
git pull

# 2. Build new image
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build app

# 3. Deploy with zero downtime
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps --scale app=2

# 4. Remove old containers (after health checks pass)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps --scale app=2
```

### Manual Blue-Green Deployment

```bash
# 1. Check current environment
docker ps --format '{{.Names}}' | grep screenshot_app

# 2. Deploy to inactive environment (e.g., green)
docker-compose -f docker-compose.yml -f docker-compose.blue-green.yml up -d app-green

# 3. Verify new environment
curl http://localhost:3002/api/health

# 4. Switch traffic (update load balancer)
# For nginx: Update nginx.conf
# For Traefik: Automatic via labels

# 5. Stop old environment
docker-compose -f docker-compose.yml -f docker-compose.blue-green.yml stop app-blue
```

## Environment Variables

Create a `.env` file with:

```env
# Database
POSTGRES_PASSWORD=your_secure_password

# Authentication
JWT_SECRET=your_jwt_secret

# Email (Postmark)
POSTMARK_SERVER_TOKEN=your_postmark_token

# Storage (Cloudflare R2)
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-cdn-url.com

# Application
APP_URL=https://your-domain.com
DOMAIN=your-domain.com
```

## Monitoring Deployments

### Check deployment status
```bash
# View running containers
docker-compose ps

# Check logs
docker-compose logs -f app

# Monitor health endpoint
watch -n 2 'curl -s http://localhost:3000/api/health | jq'
```

### Rollback Procedure

If deployment fails:

```bash
# Automatic rollback
./deploy.sh rollback

# Manual rollback (rolling update)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --force-recreate app

# Manual rollback (blue-green)
# Switch back to previous environment
docker-compose -f docker-compose.yml -f docker-compose.blue-green.yml \
  up -d app-blue  # or app-green
```

## Best Practices

1. **Always test locally first**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
   ```

2. **Monitor health checks during deployment**
   - Wait for health checks to pass before considering deployment successful
   - Set appropriate health check intervals and timeouts

3. **Database migrations**
   - Run migrations separately before deployment
   - Use `./deploy.sh migrate`

4. **Backup before major updates**
   ```bash
   docker-compose exec postgres pg_dump -U screenshot_user screenshot_db > backup.sql
   ```

5. **Use deployment environments**
   - Test in staging before production
   - Keep staging environment identical to production

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose config

# Check health endpoint manually
curl -v http://localhost:3000/api/health
```

### Database connection issues
```bash
# Test database connection
docker-compose exec postgres psql -U screenshot_user -d screenshot_db

# Check database logs
docker-compose logs postgres
```

### Slow deployments
- Increase health check intervals
- Pre-pull images on all nodes
- Use image registry for faster pulls

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          ssh user@server 'cd /app && ./deploy.sh'
```

### GitLab CI Example
```yaml
deploy:
  stage: deploy
  script:
    - ssh user@server 'cd /app && ./deploy.sh'
  only:
    - main
```

## Security Considerations

1. Use secrets management for sensitive environment variables
2. Enable HTTPS with proper certificates
3. Restrict database access to app containers only
4. Regular security updates for base images
5. Use read-only file systems where possible

## Performance Optimization

1. Use multi-stage Docker builds (already implemented)
2. Enable Docker layer caching
3. Use CDN for static assets
4. Configure proper resource limits
5. Monitor container metrics

## Support

For issues or questions:
- Check container logs: `docker-compose logs`
- Verify health endpoints: `/api/health`, `/api/ready`, `/api/live`
- Review deployment script output for errors