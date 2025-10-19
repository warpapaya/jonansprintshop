
Jonan's Print Shop

⸻

🧭 Overview

The Jonan's Print Shop is a self-hosted, dockerized web app that allows a local vendor to submit orders for 3D-printed clay cutters and lets Jonan manage them efficiently. The goal is to replace text message coordination with a clean web-based workflow.

The system must be zero-cost to host, run fully within Petie’s existing Docker infrastructure, and integrate with external automation via webhooks instead of SaaS dependencies.

⸻

🎯 Goals
	•	Eliminate back-and-forth text messaging between vendor and parents.
	•	Give Jonan a clear, simple dashboard for managing active and completed orders.
	•	Allow the vendor to submit new orders with attachments and receive status updates automatically.
	•	Send notifications via webhooks to external systems for flexible automation (e.g., email/SMS).
	•	Keep deployment lightweight, local, and dependency-free.

⸻

👤 User Roles

Role	Capabilities
Vendor	Create orders, upload attachments, view order status, confirm pickup times
Jonan	View all orders, update order status, upload completion photos, schedule pickups
Parent  Read-only dashboard view
Admin	Manage users, pickup windows, and API/webhook configuration


⸻

🧱 Core Features

1. Order Creation (Vendor)
	•	Simple web form for submitting orders:
	•	Item name
	•	Quantity
	•	Color/material (optional)
	•	Notes
	•	Preferred completion/pickup date
	•	File uploads (.stl, .3mf, .zip, .png, .jpg)
	•	Displays confirmation message and order ID on success.
	•	Submissions create a new record and emit a order.created webhook event.

2. Dashboard (Jonan)
	•	Kanban or list-style dashboard with the following statuses:
	•	new → prepping → printing → finished → ready → delivered → archived
	•	Click to view full order details:
	•	Files, notes, vendor info, history timeline
	•	Buttons for updating status, uploading completion photos, and setting pickup times
	•	Each change emits a webhook event (e.g., order.status.changed, order.ready).

3. Pickup Coordination
	•	Configurable pickup windows defined by admin (e.g., Tue/Thu 3–5 PM).
	•	When Jonan marks an order “ready,” the vendor receives a webhook-triggered link to confirm a pickup time.
	•	Once confirmed, a pickup.confirmed webhook is sent.

4. Attachments
	•	Files stored on local volume (/data/uploads).
	•	Basic whitelist validation for file types.
	•	Optional ClamAV container for malware scanning.
	•	Thumbnail generation for image files (optional phase 2).

5. Webhook System
	•	Configurable via admin UI.
	•	Supports multiple endpoints.

⸻

⚙️ Technical Architecture

Frontend
	•	Framework: React + Vite
	•	Styling: TailwindCSS
	•	Hosting: Served by Nginx container
	•	Design: Mobile-first, clean, minimal (dashboard + order detail + vendor form)

Backend
	•	Framework: FastAPI (Python)
	•	Database: PostgreSQL (containerized)
	•	Storage: Local volume for file uploads
	•	Auth: JWT-based login with bcrypt password hashing
	•	Notifications: Outbound webhooks only (no email service)
	•	Deployment: Docker Compose stack (3–4 services total)

⸻

🪣 Data Model

users

Field	Type	Notes
id	uuid	Primary key
name	text	
email	text	unique
password_hash	text	bcrypt
role	enum	admin / jonan / vendor / parent
created_at	timestamp	auto
updated_at	timestamp	auto

orders

Field	Type	Notes
id	uuid	Primary key
vendor_id	uuid	FK → users.id
item_name	text	
quantity	int	
color_material	text	optional
notes	text	optional
preferred_date	date	optional
status	enum	new / prepping / printing / finished / ready / delivered / archived
pickup_time	timestamp	optional
created_at	timestamp	auto
updated_at	timestamp	auto

attachments

Field	Type	Notes
id	uuid	Primary key
order_id	uuid	FK → orders.id
filename	text	
mime_type	text	
size_bytes	int	
storage_path	text	
created_at	timestamp	auto

status_events

Tracks all status changes and user actions for history/audit.

⸻

🔔 Webhooks

Endpoint configured via admin UI

Example Payload:

{
  "id": "c80d7b1c-3b15-4b40-aac2-02a7c9f3b19e",
  "event": "order.status.changed",
  "occurred_at": "2025-10-18T21:07:00Z",
  "data": {
    "order_id": "29de6d4b-a98a-480a-bd2b-ef8a1cd9e76e",
    "old_status": "printing",
    "new_status": "finished",
    "actor": {
      "name": "Jonan",
      "role": "jonan"
    }
  }
}


⸻

🐳 Docker Setup

Services
	•	db → PostgreSQL
	•	backend → FastAPI app
	•	frontend → React + Nginx
	•	(optional) clamav → file scanning

Volumes
	•	/data/db → PostgreSQL data
	•	/data/uploads → attachments

Reverse Proxy

Handled externally via Traefik with HTTPS and routing (e.g. orders.petieclark.com).

⸻

🔐 Security
	•	JWT-based sessions with refresh tokens.
	•	HTTPS enforced via proxy.
	•	File size and type validation.
	•	CORS locked to approved origins (orders.petieclark.com and localhost for testing)

⸻

🗓 Roadmap

MVP
	•	Vendor order creation
	•	Jonan dashboard & status updates
	•	Webhook integration
	•	Pickup confirmation flow
	•	Local file upload + download
	•	Parent read-only dashboard

Phase 2
	•	Thumbnail previews
	•	CSV export & summary metrics
	•	Revenue tracking for Jonan

⸻

✅ Acceptance Criteria
	•	Orders can be submitted, updated, and tracked end-to-end.
	•	Webhooks fire reliably for all key events.
	•	UI works cleanly on mobile and desktop.
	•	Docker stack deploys with a single command (docker compose up -d).
	•	All data persists across container restarts.
