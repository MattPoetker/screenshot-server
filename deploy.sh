#!/bin/bash

# Screenshot Server Deployment Script
# Supports both rolling updates and blue-green deployments

set -e

# Configuration
COMPOSE_PROJECT_NAME="screenshot-server"
HEALTH_CHECK_URL="${APP_URL:-http://localhost:3000}/api/health"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_DELAY=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if Docker and Docker Compose are installed
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
}

# Health check function
health_check() {
    local url=$1
    local retries=${2:-$HEALTH_CHECK_RETRIES}
    local delay=${3:-$HEALTH_CHECK_DELAY}
    
    info "Performing health check on $url"
    
    for i in $(seq 1 $retries); do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log "Health check passed"
            return 0
        fi
        
        if [ $i -lt $retries ]; then
            echo -n "."
            sleep $delay
        fi
    done
    
    error "Health check failed after $retries attempts"
    return 1
}

# Rolling update deployment
rolling_update() {
    log "Starting rolling update deployment"
    
    # Pull latest code
    if [ -d .git ]; then
        info "Pulling latest code from git"
        git pull
    fi
    
    # Build new image
    info "Building new Docker image"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build app
    
    # Get current number of replicas
    CURRENT_REPLICAS=$(docker-compose ps -q app | wc -l)
    TARGET_REPLICAS=${REPLICAS:-2}
    
    info "Current replicas: $CURRENT_REPLICAS, Target replicas: $TARGET_REPLICAS"
    
    # Scale up first (start new containers)
    info "Starting new containers"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps --scale app=$((TARGET_REPLICAS * 2)) app
    
    # Wait for new containers to be healthy
    sleep 10
    if ! health_check "$HEALTH_CHECK_URL"; then
        error "New containers failed health check, rolling back"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps --scale app=$CURRENT_REPLICAS app
        exit 1
    fi
    
    # Scale down to target number
    info "Removing old containers"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps --scale app=$TARGET_REPLICAS app
    
    log "Rolling update completed successfully"
}

# Blue-Green deployment
blue_green_deploy() {
    log "Starting blue-green deployment"
    
    # Determine current active environment
    if docker ps --format '{{.Names}}' | grep -q "screenshot_app_blue"; then
        if docker inspect screenshot_app_blue | grep -q '"Status": "running"'; then
            CURRENT_ENV="blue"
            NEW_ENV="green"
        else
            CURRENT_ENV="green"
            NEW_ENV="blue"
        fi
    else
        CURRENT_ENV="green"
        NEW_ENV="blue"
    fi
    
    info "Current environment: $CURRENT_ENV, Deploying to: $NEW_ENV"
    
    # Pull latest code
    if [ -d .git ]; then
        info "Pulling latest code from git"
        git pull
    fi
    
    # Build new image
    info "Building new Docker image for $NEW_ENV environment"
    docker-compose -f docker-compose.yml -f docker-compose.blue-green.yml build app-$NEW_ENV
    
    # Start new environment
    info "Starting $NEW_ENV environment"
    docker-compose -f docker-compose.yml -f docker-compose.blue-green.yml up -d app-$NEW_ENV
    
    # Wait for new environment to be healthy
    NEW_ENV_PORT=$([[ "$NEW_ENV" == "blue" ]] && echo "3001" || echo "3002")
    NEW_ENV_URL="http://localhost:$NEW_ENV_PORT/api/health"
    
    if ! health_check "$NEW_ENV_URL"; then
        error "$NEW_ENV environment failed health check"
        docker-compose -f docker-compose.yml -f docker-compose.blue-green.yml stop app-$NEW_ENV
        exit 1
    fi
    
    # Switch traffic to new environment (update nginx/traefik config)
    info "Switching traffic to $NEW_ENV environment"
    
    # If using nginx, update the upstream
    if [ -f "./nginx/nginx.conf" ]; then
        sed -i "s/app-$CURRENT_ENV/app-$NEW_ENV/g" ./nginx/nginx.conf
        docker-compose restart nginx
    fi
    
    # If using Traefik, the labels handle this automatically
    
    # Verify new environment is serving traffic
    sleep 5
    if ! health_check "$HEALTH_CHECK_URL"; then
        error "Traffic switch failed, rolling back"
        if [ -f "./nginx/nginx.conf" ]; then
            sed -i "s/app-$NEW_ENV/app-$CURRENT_ENV/g" ./nginx/nginx.conf
            docker-compose restart nginx
        fi
        exit 1
    fi
    
    # Stop old environment
    info "Stopping $CURRENT_ENV environment"
    docker-compose -f docker-compose.yml -f docker-compose.blue-green.yml stop app-$CURRENT_ENV
    
    log "Blue-Green deployment completed successfully"
    info "New active environment: $NEW_ENV"
}

# Rollback function
rollback() {
    warning "Starting rollback procedure"
    
    if [ "$1" == "blue-green" ]; then
        # Blue-Green rollback
        if docker ps --format '{{.Names}}' | grep -q "screenshot_app_blue"; then
            if docker inspect screenshot_app_blue | grep -q '"Status": "running"'; then
                CURRENT_ENV="blue"
                OLD_ENV="green"
            else
                CURRENT_ENV="green"
                OLD_ENV="blue"
            fi
        else
            CURRENT_ENV="green"
            OLD_ENV="blue"
        fi
        
        info "Rolling back from $CURRENT_ENV to $OLD_ENV"
        
        # Start old environment
        docker-compose -f docker-compose.yml -f docker-compose.blue-green.yml up -d app-$OLD_ENV
        
        # Switch traffic back
        if [ -f "./nginx/nginx.conf" ]; then
            sed -i "s/app-$CURRENT_ENV/app-$OLD_ENV/g" ./nginx/nginx.conf
            docker-compose restart nginx
        fi
        
        # Stop current environment
        docker-compose -f docker-compose.yml -f docker-compose.blue-green.yml stop app-$CURRENT_ENV
        
    else
        # Rolling update rollback
        info "Rolling back to previous image"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate app
    fi
    
    log "Rollback completed"
}

# Database migration
run_migrations() {
    info "Running database migrations"
    docker-compose exec -T app npm run migrate || {
        error "Migration failed"
        return 1
    }
    log "Migrations completed successfully"
}

# Main script
main() {
    check_dependencies
    
    case "${1:-rolling}" in
        rolling)
            rolling_update
            ;;
        blue-green)
            blue_green_deploy
            ;;
        rollback)
            rollback "${2:-rolling}"
            ;;
        migrate)
            run_migrations
            ;;
        health)
            health_check "$HEALTH_CHECK_URL"
            ;;
        *)
            echo "Usage: $0 {rolling|blue-green|rollback|migrate|health}"
            echo ""
            echo "Commands:"
            echo "  rolling     - Perform a rolling update (default)"
            echo "  blue-green  - Perform a blue-green deployment"
            echo "  rollback    - Rollback to previous version"
            echo "  migrate     - Run database migrations"
            echo "  health      - Check application health"
            exit 1
            ;;
    esac
}

main "$@"