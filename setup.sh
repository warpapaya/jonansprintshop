#!/bin/bash

# Clay Cutter Order Portal Setup Script

echo "Setting up Clay Cutter Order Portal..."

# Create data directories
mkdir -p data/db data/uploads

# Set permissions
chmod 755 data/db data/uploads

# Create initial admin user script
cat > create_admin.py << 'EOF'
import sys
sys.path.append('/app')

from database import SessionLocal
from models import User
from auth import get_password_hash

def create_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@example.com").first()
        if existing_admin:
            print("Admin user already exists")
            return
        
        # Create admin user
        admin = User(
            name="System Administrator",
            email="admin@example.com",
            password_hash=get_password_hash("admin123"),
            role="admin"
        )
        
        db.add(admin)
        db.commit()
        print("Admin user created successfully!")
        print("Email: admin@example.com")
        print("Password: admin123")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
EOF

echo "Setup complete!"
echo ""
echo "To start the application:"
echo "  docker compose up -d"
echo ""
echo "To create an admin user:"
echo "  docker compose exec backend python create_admin.py"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000"
