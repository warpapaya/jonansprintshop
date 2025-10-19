import sys
sys.path.append('/app')

from database import SessionLocal, engine
from models import Base, User, UserRole
import hashlib

def create_admin():
    # Create tables first
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@example.com").first()
        if existing_admin:
            print("Admin user already exists")
            print("Email: admin@example.com")
            print("Password: admin")
            return
        
        # Create admin user with simple hash (for testing only)
        simple_hash = hashlib.sha256("admin".encode()).hexdigest()
        
        admin = User(
            name="System Administrator",
            email="admin@example.com",
            password_hash=simple_hash,  # Simple hash for testing
            role=UserRole.ADMIN
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
