from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os

from database import get_db, engine
from models import Base
from auth import get_current_user
from routers import auth, orders, users, webhooks
from config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

# Create startup admin user
try:
    from create_startup_admin import create_admin_user
    create_admin_user()
except Exception as e:
    print(f"Warning: Could not create startup admin: {e}")

app = FastAPI(
    title="Clay Cutter Order Portal",
    description="A self-hosted order management system for 3D-printed clay cutters",
    version="1.0.0"
)

# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"VALIDATION ERROR: {exc.errors()}")
    print(f"VALIDATION ERROR BODY: {exc.body}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    return {"status": "healthy"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Clay Cutter Order Portal API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
