from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import os
import uuid
import shutil

from database import get_db
from models import User, Order, OrderStatus, Attachment, StatusEvent
from auth import get_current_user, require_roles, UserRole
from config import settings

router = APIRouter()

class OrderCreate(BaseModel):
    item_name: str
    quantity: int
    color_material: Optional[str] = None
    notes: Optional[str] = None
    preferred_date: Optional[datetime] = None

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    pickup_time: Optional[datetime] = None

class OrderResponse(BaseModel):
    id: str
    vendor_id: str
    item_name: str
    quantity: int
    color_material: Optional[str]
    notes: Optional[str]
    preferred_date: Optional[str]
    status: OrderStatus
    pickup_time: Optional[str]
    created_at: str
    updated_at: Optional[str]
    vendor_name: str
    attachments: List[dict]

class AttachmentResponse(BaseModel):
    id: str
    filename: str
    mime_type: str
    size_bytes: int
    created_at: str

def save_upload_file(upload_file: UploadFile, order_id: str) -> str:
    """Save uploaded file and return storage path"""
    file_extension = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    storage_path = os.path.join(settings.UPLOAD_DIR, str(order_id), unique_filename)
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(storage_path), exist_ok=True)
    
    with open(storage_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    
    return storage_path

@router.post("/", response_model=OrderResponse)
async def create_order(
    item_name: str = Form(...),
    quantity: int = Form(...),
    color_material: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    preferred_date: Optional[datetime] = Form(None),
    files: List[UploadFile] = File(None),
    current_user: User = Depends(require_roles([UserRole.VENDOR])),
    db: Session = Depends(get_db)
):
    # Debug logging
    print(f"DEBUG: item_name={item_name}, quantity={quantity}, color_material={color_material}, notes={notes}, preferred_date={preferred_date}")
    print(f"DEBUG: files={files}")
    print(f"DEBUG: current_user={current_user.email}, role={current_user.role}")
    
    # Create order
    order = Order(
        vendor_id=current_user.id,
        item_name=item_name,
        quantity=quantity,
        color_material=color_material,
        notes=notes,
        preferred_date=preferred_date,
        status=OrderStatus.NEW
    )
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Handle file uploads
    attachments = []
    if files:
        for file in files:
            if file.size > settings.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"File {file.filename} is too large"
                )
            
            if file.content_type not in settings.ALLOWED_FILE_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"File type {file.content_type} not allowed"
                )
            
            storage_path = save_upload_file(file, order.id)
            
            attachment = Attachment(
                order_id=order.id,
                filename=file.filename,
                mime_type=file.content_type,
                size_bytes=file.size,
                storage_path=storage_path
            )
            
            db.add(attachment)
            attachments.append(attachment)
    
    db.commit()
    
    # Create status event
    status_event = StatusEvent(
        order_id=order.id,
        actor_id=current_user.id,
        new_status=OrderStatus.NEW,
        event_type="order.created"
    )
    db.add(status_event)
    db.commit()
    
    # Return order with attachments
    order_attachments = [
        {
            "id": str(att.id),
            "filename": att.filename,
            "mime_type": att.mime_type,
            "size_bytes": att.size_bytes,
            "created_at": att.created_at.isoformat()
        }
        for att in attachments
    ]
    
    return OrderResponse(
        id=str(order.id),
        vendor_id=str(order.vendor_id),
        item_name=order.item_name,
        quantity=order.quantity,
        color_material=order.color_material,
        notes=order.notes,
        preferred_date=order.preferred_date.isoformat() if order.preferred_date else None,
        status=order.status,
        pickup_time=order.pickup_time.isoformat() if order.pickup_time else None,
        created_at=order.created_at.isoformat(),
        updated_at=order.updated_at.isoformat() if order.updated_at else None,
        vendor_name=current_user.name,
        attachments=order_attachments
    )

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    status: Optional[OrderStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    
    # Filter by user role
    if current_user.role == UserRole.VENDOR:
        query = query.filter(Order.vendor_id == current_user.id)
    elif current_user.role == UserRole.PARENT:
        # Parents can only see delivered orders
        query = query.filter(Order.status == OrderStatus.DELIVERED)
    
    # Filter by status if provided
    if status:
        query = query.filter(Order.status == status)
    
    orders = query.order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        attachments = [
            {
                "id": str(att.id),
                "filename": att.filename,
                "mime_type": att.mime_type,
                "size_bytes": att.size_bytes,
                "created_at": att.created_at.isoformat()
            }
            for att in order.attachments
        ]
        
        result.append(OrderResponse(
            id=str(order.id),
            vendor_id=str(order.vendor_id),
            item_name=order.item_name,
            quantity=order.quantity,
            color_material=order.color_material,
            notes=order.notes,
            preferred_date=order.preferred_date.isoformat() if order.preferred_date else None,
            status=order.status,
            pickup_time=order.pickup_time.isoformat() if order.pickup_time else None,
            created_at=order.created_at.isoformat(),
            updated_at=order.updated_at.isoformat() if order.updated_at else None,
            vendor_name=order.vendor.name,
            attachments=attachments
        ))
    
    return result

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check permissions
    if current_user.role == UserRole.VENDOR and order.vendor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    elif current_user.role == UserRole.PARENT and order.status != OrderStatus.DELIVERED:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    attachments = [
        {
            "id": str(att.id),
            "filename": att.filename,
            "mime_type": att.mime_type,
            "size_bytes": att.size_bytes,
            "created_at": att.created_at.isoformat()
        }
        for att in order.attachments
    ]
    
    return OrderResponse(
        id=str(order.id),
        vendor_id=str(order.vendor_id),
        item_name=order.item_name,
        quantity=order.quantity,
        color_material=order.color_material,
        notes=order.notes,
        preferred_date=order.preferred_date.isoformat() if order.preferred_date else None,
        status=order.status,
        pickup_time=order.pickup_time.isoformat() if order.pickup_time else None,
        created_at=order.created_at.isoformat(),
        updated_at=order.updated_at.isoformat() if order.updated_at else None,
        vendor_name=order.vendor.name,
        attachments=attachments
    )

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    order_update: OrderUpdate,
    current_user: User = Depends(require_roles([UserRole.JONAN, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status
    
    if order_update.status is not None:
        order.status = order_update.status
    
    if order_update.pickup_time is not None:
        order.pickup_time = order_update.pickup_time
    
    db.commit()
    db.refresh(order)
    
    # Create status event if status changed
    if order_update.status is not None and order_update.status != old_status:
        status_event = StatusEvent(
            order_id=order.id,
            actor_id=current_user.id,
            old_status=old_status,
            new_status=order_update.status,
            event_type="status.changed"
        )
        db.add(status_event)
        db.commit()
    
    # Return updated order
    attachments = [
        {
            "id": str(att.id),
            "filename": att.filename,
            "mime_type": att.mime_type,
            "size_bytes": att.size_bytes,
            "created_at": att.created_at.isoformat()
        }
        for att in order.attachments
    ]
    
    return OrderResponse(
        id=str(order.id),
        vendor_id=str(order.vendor_id),
        item_name=order.item_name,
        quantity=order.quantity,
        color_material=order.color_material,
        notes=order.notes,
        preferred_date=order.preferred_date.isoformat() if order.preferred_date else None,
        status=order.status,
        pickup_time=order.pickup_time.isoformat() if order.pickup_time else None,
        created_at=order.created_at.isoformat(),
        updated_at=order.updated_at.isoformat() if order.updated_at else None,
        vendor_name=order.vendor.name,
        attachments=attachments
    )
@router.delete("/{order_id}")
async def delete_order(
    order_id: str,
    current_user: User = Depends(require_roles([UserRole.JONAN, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Delete an order (Jonan and Admin only)"""
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order ID format"
        )
    
    # Get the order
    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Delete associated files
    for attachment in order.attachments:
        file_path = os.path.join(settings.UPLOAD_DIR, attachment.storage_path)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass  # Continue even if file deletion fails
    
    # Delete the order (cascade will handle attachments and status_events)
    db.delete(order)
    db.commit()
    
    return {"message": "Order deleted successfully"}
