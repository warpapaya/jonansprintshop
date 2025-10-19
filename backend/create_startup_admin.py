#!/usr/bin/env python3
"""
Startup script to create a hardcoded admin user for initial setup.
This ensures there's always an admin account available.
"""

import os
import sys
import hashlib
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import User, UserRole

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/clay_cutter_orders")

def create_admin_user():
    """Create a hardcoded admin user for initial setup"""
    try:
        # Create database connection
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@example.com").first()
        if existing_admin:
            print("Admin user already exists!")
            return
        
        # Create admin user with simple SHA256 hash
        password_hash = hashlib.sha256("admin123".encode()).hexdigest()
        
        admin_user = User(
            email="admin@example.com",
            name="Admin User",
            password_hash=password_hash,
            role=UserRole.ADMIN
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Admin user created successfully!")
        print("📧 Email: admin@example.com")
        print("🔑 Password: admin123")
        print("👤 Role: Admin")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        sys.exit(1)
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    create_admin_user()
