#!/bin/bash

# Quick fix for production database issues
# This script creates the missing database and restarts services

echo "🔧 Fixing production database issues..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Stop backend to avoid connection issues
echo "🛑 Stopping backend service..."
docker compose stop backend

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Create the missing database
echo "🗄️ Creating missing database..."
docker exec jonansorderportal-db-1 psql -U postgres -c "CREATE DATABASE jonans_print_shop;" 2>/dev/null || echo "Database might already exist"

# Start backend service
echo "🚀 Starting backend service..."
docker compose up -d backend

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Check if backend is healthy
echo "🔍 Checking backend status..."
if docker compose ps backend | grep -q "healthy\|Up"; then
    echo "✅ Backend is running successfully!"
    
    # Test admin login
    echo "🔐 Testing admin login..."
    ADMIN_TOKEN=$(curl -s -X POST https://orders.petieclark.com/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email": "admin@example.com", "password": "admin123"}' \
        | jq -r '.access_token' 2>/dev/null)
    
    if [ "$ADMIN_TOKEN" != "null" ] && [ "$ADMIN_TOKEN" != "" ]; then
        echo "✅ Admin login successful!"
        echo "🎉 Production database fix completed successfully!"
    else
        echo "⚠️ Admin login failed, but backend is running. Check logs:"
        echo "docker compose logs backend"
    fi
else
    echo "❌ Backend failed to start. Check logs:"
    echo "docker compose logs backend"
fi

echo "📋 Next steps:"
echo "1. Check the application at https://orders.petieclark.com"
echo "2. Login with admin@example.com / admin123"
echo "3. Configure webhooks in the admin panel"
