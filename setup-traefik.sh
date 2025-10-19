#!/bin/bash

# Setup script for Jonan's Print Shop with Traefik integration

echo "🚀 Setting up Jonan's Print Shop with Traefik integration..."

# Check if web_proxy network exists, create if not
if ! docker network ls | grep -q "web_proxy"; then
    echo "📡 Creating web_proxy network..."
    docker network create web_proxy
else
    echo "✅ web_proxy network already exists"
fi

# Check if Traefik is running
if docker ps | grep -q "traefik"; then
    echo "✅ Traefik is running"
else
    echo "⚠️  Warning: Traefik doesn't appear to be running"
    echo "   Make sure Traefik is started before running this application"
fi

echo ""
echo "🎯 Ready to start Jonan's Print Shop!"
echo "   Run: docker compose up -d"
echo "   Access: http://printshop.localhost"
echo ""
