from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    JONAN = "jonan"
    VENDOR = "vendor"
    PARENT = "parent"

class OrderStatus(str, enum.Enum):
    NEW = "new"
    PREPPING = "prepping"
    PRINTING = "printing"
    FINISHED = "finished"
    READY = "ready"
    DELIVERED = "delivered"
    ARCHIVED = "archived"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="vendor")
    status_events = relationship("StatusEvent", back_populates="actor")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    item_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    color_material = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    preferred_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.NEW, nullable=False)
    pickup_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    vendor = relationship("User", back_populates="orders")
    attachments = relationship("Attachment", back_populates="order", cascade="all, delete-orphan")
    status_events = relationship("StatusEvent", back_populates="order", cascade="all, delete-orphan")

class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    storage_path = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="attachments")

class StatusEvent(Base):
    __tablename__ = "status_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    old_status = Column(SQLEnum(OrderStatus), nullable=True)
    new_status = Column(SQLEnum(OrderStatus), nullable=False)
    event_type = Column(String, nullable=False)  # e.g., "status.changed", "pickup.scheduled"
    event_metadata = Column(Text, nullable=True)  # JSON string for additional data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="status_events")
    actor = relationship("User", back_populates="status_events")

class WebhookConfig(Base):
    __tablename__ = "webhook_configs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    url = Column(String, nullable=False)
    events = Column(Text, nullable=False)  # JSON string of event types
    is_active = Column(String, nullable=False, default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
