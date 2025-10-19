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
            password_hash=get_password_hash("admin"),
            role="admin"
        )
        
        db.add(admin)
        db.commit()
        print("Admin user created successfully!")
        print("Email: admin@example.com")
        print("Password: admin")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
