from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import httpx
import json
import uuid
from datetime import datetime

from database import get_db
from models import User, Order, StatusEvent, WebhookConfig as WebhookConfigModel
from auth import get_current_user, require_role, UserRole

router = APIRouter()

class WebhookConfigResponse(BaseModel):
    id: str
    url: str
    events: List[str]
    is_active: bool

class WebhookEvent(BaseModel):
    id: str
    event: str
    occurred_at: str
    data: dict

async def send_webhook(event_type: str, data: dict, db: Session):
    """Send webhook to all configured endpoints"""
    configs = db.query(WebhookConfigModel).filter(WebhookConfigModel.is_active == "true").all()
    for config in configs:
        try:
            events = json.loads(config.events)
            if event_type not in events:
                continue
        except (json.JSONDecodeError, TypeError):
            continue
        
        payload = {
            "id": str(uuid.uuid4()),
            "event": event_type,
            "occurred_at": datetime.utcnow().isoformat() + "Z",
            "data": data
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    config.url,
                    json=payload,
                    timeout=10.0
                )
                response.raise_for_status()
        except Exception as e:
            # Log error but don't fail the main operation
            print(f"Webhook failed for {config.url}: {e}")

class WebhookConfigCreate(BaseModel):
    url: str
    events: List[str]

@router.post("/config", response_model=WebhookConfigResponse)
async def create_webhook_config(
    config_data: WebhookConfigCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    config = WebhookConfigModel(
        url=config_data.url,
        events=json.dumps(config_data.events),
        is_active="true"
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    
    return WebhookConfigResponse(
        id=str(config.id),
        url=config.url,
        events=json.loads(config.events),
        is_active=config.is_active == "true"
    )

@router.get("/config", response_model=List[WebhookConfigResponse])
async def get_webhook_configs_endpoint(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    configs = db.query(WebhookConfigModel).all()
    return [
        WebhookConfigModel(
            id=str(config.id),
            url=config.url,
            events=json.loads(config.events),
            is_active=config.is_active == "true"
        )
        for config in configs
    ]

@router.put("/config/{config_id}", response_model=WebhookConfigResponse)
async def update_webhook_config(
    config_id: str,
    url: Optional[str] = None,
    events: Optional[List[str]] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    try:
        config_uuid = uuid.UUID(config_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid config ID format")
    
    config = db.query(WebhookConfigModel).filter(WebhookConfigModel.id == config_uuid).first()
    if not config:
        raise HTTPException(status_code=404, detail="Webhook config not found")
    
    if url is not None:
        config.url = url
    if events is not None:
        config.events = json.dumps(events)
    if is_active is not None:
        config.is_active = "true" if is_active else "false"
    
    db.commit()
    db.refresh(config)
    
    return WebhookConfigResponse(
        id=str(config.id),
        url=config.url,
        events=json.loads(config.events),
        is_active=config.is_active == "true"
    )

@router.delete("/config/{config_id}")
async def delete_webhook_config(
    config_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    try:
        config_uuid = uuid.UUID(config_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid config ID format")
    
    config = db.query(WebhookConfigModel).filter(WebhookConfigModel.id == config_uuid).first()
    if not config:
        raise HTTPException(status_code=404, detail="Webhook config not found")
    
    db.delete(config)
    db.commit()
    return {"message": "Webhook config deleted"}

class WebhookTest(BaseModel):
    url: str

@router.post("/test")
async def test_webhook(
    test_data: WebhookTest,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Test webhook endpoint"""
    test_payload = {
        "id": str(uuid.uuid4()),
        "event": "test",
        "occurred_at": datetime.utcnow().isoformat() + "Z",
        "data": {
            "message": "This is a test webhook"
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(test_data.url, json=test_payload, timeout=10.0)
            response.raise_for_status()
            return {"status": "success", "response": response.text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook test failed: {str(e)}")
