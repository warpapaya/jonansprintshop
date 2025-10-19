#!/bin/bash

# Production deployment script for Jonan's Print Shop
# This script updates the production environment with the latest code

echo "🚀 Deploying Jonan's Print Shop to production..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Remove old images to force rebuild
echo "🗑️ Removing old images..."
docker image prune -f

# Rebuild and start services
echo "🔨 Rebuilding and starting services..."
docker compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker compose ps

# Test admin login
echo "🔐 Testing admin login..."
ADMIN_TOKEN=$(curl -s -X POST https://orders.petieclark.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@example.com", "password": "admin123"}' \
    | jq -r '.access_token')

if [ "$ADMIN_TOKEN" != "null" ] && [ "$ADMIN_TOKEN" != "" ]; then
    echo "✅ Admin login successful!"
    echo "🎉 Deployment completed successfully!"
else
    echo "❌ Admin login failed. Please check the logs:"
    echo "docker compose logs backend"
fi

echo "📋 Next steps:"
echo "1. Check the application at https://orders.petieclark.com"
echo "2. Login with admin@example.com / admin123"
echo "3. Configure webhooks in the admin panel"
echo "4. Test order creation and management"
