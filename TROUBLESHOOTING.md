# 🔧 Troubleshooting Guide

## Login Failed Errors

### Common Causes & Solutions

#### 1. **502 Bad Gateway Error**
- **Cause**: Backend service not running or not accessible
- **Solution**: 
  ```bash
  # Check if backend is running
  docker compose ps
  
  # Restart backend if needed
  docker compose up -d --build backend
  
  # Check backend logs
  docker compose logs backend
  ```

#### 2. **Database Connection Issues**
- **Cause**: Database not accessible or wrong credentials
- **Solution**:
  ```bash
  # Check database status
  docker compose logs db
  
  # Restart database
  docker compose up -d db
  
  # Wait for database to be healthy
  docker compose ps
  ```

#### 3. **Admin User Not Created**
- **Cause**: Startup script failed or admin user doesn't exist
- **Solution**:
  ```bash
  # Check if admin user exists
  docker exec jonansorderportal-db-1 psql -U postgres -d jonans_print_shop -c "SELECT email, name FROM users WHERE email = 'admin@example.com';"
  
  # If no admin user, restart backend to trigger creation
  docker compose restart backend
  ```

#### 4. **Wrong Login Format**
- **Cause**: Frontend sending form data instead of JSON
- **Solution**: Ensure frontend is sending JSON format:
  ```json
  {
    "email": "admin@example.com",
    "password": "admin123"
  }
  ```

### Quick Fixes

#### Reset Everything
```bash
# Stop all services
docker compose down -v

# Remove all data (WARNING: This will delete all data)
docker volume prune -f

# Start fresh
docker compose up -d --build
```

#### Check Service Health
```bash
# Check all services
docker compose ps

# Check specific service logs
docker compose logs backend
docker compose logs db
docker compose logs frontend
```

#### Test API Endpoints
```bash
# Test health endpoint
curl https://orders.petieclark.com/health

# Test login endpoint
curl -X POST https://orders.petieclark.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### Production Deployment

#### Update Production
```bash
# Run the deployment script
./deploy-production.sh
```

#### Manual Production Update
```bash
# Pull latest code
git pull origin main

# Stop services
docker compose down

# Rebuild and start
docker compose up -d --build

# Check status
docker compose ps
```

### Default Admin Credentials
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: Admin

### Support
If issues persist, check the logs and contact the maintainer with:
1. Error messages from logs
2. Steps to reproduce the issue
3. Environment details (local vs production)
