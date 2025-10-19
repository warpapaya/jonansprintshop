# 🚨 Quick Fix for Production Database Issue

## The Problem
Your production backend is failing because the database `jonans_print_shop` doesn't exist.

## ⚡ Quick Fix (Run on Production Server)

### Option 1: One-liner Command
```bash
docker compose stop backend && docker exec jonansorderportal-db-1 psql -U postgres -c "CREATE DATABASE jonans_print_shop;" && docker compose up -d backend
```

### Option 2: Use the Fix Script
```bash
./fix-production-db.sh
```

### Option 3: Manual Steps
```bash
# 1. Stop backend
docker compose stop backend

# 2. Create database
docker exec jonansorderportal-db-1 psql -U postgres -c "CREATE DATABASE jonans_print_shop;"

# 3. Start backend
docker compose up -d backend

# 4. Check status
docker compose ps
```

## 🔍 Verify Fix
After running the fix, test the login:
```bash
curl -X POST https://orders.petieclark.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

## 📋 Expected Result
You should get a JSON response with access_token, refresh_token, and user info.

## 🆘 If Still Failing
Check backend logs:
```bash
docker compose logs backend
```

The issue is simply that the database doesn't exist yet. Once created, everything should work! 🎉
