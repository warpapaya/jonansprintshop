# Jonan's Print Shop 🖨️

A self-hosted, dockerized web application for managing 3D-printed clay cutter orders between vendors and Jonan. This system replaces text message coordination with a clean web-based workflow.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/warpapaya/jonansprintshop.git
cd jonansprintshop

# Ensure the web_proxy network exists (for Traefik integration)
docker network create web_proxy 2>/dev/null || true

# Start the application
docker compose up -d

# View logs
docker compose logs -f

# Stop the application
docker compose down
```

## 🔧 Traefik Integration

This application is configured to work with Traefik reverse proxy:

- **Domain**: `printshop.localhost`
- **Network**: `web_proxy` (external)
- **Entrypoint**: `web`
- **Automatic HTTPS**: Configured for production use

The frontend is accessible at `http://printshop.localhost` and the API is automatically proxied through the frontend at `/api/` endpoints.

## 🏗️ Architecture

- **Backend**: FastAPI (Python) with PostgreSQL
- **Frontend**: React + Vite with TailwindCSS
- **Database**: PostgreSQL with local volume persistence
- **Storage**: Local file uploads in `/data/uploads`
- **Authentication**: JWT-based with role-based access control
- **Webhooks**: Production-ready webhook system for external automation

## 🐳 Services

- `db`: PostgreSQL database
- `backend`: FastAPI application (port 8000)
- `frontend`: React application served by Nginx (port 3001)
- `clamav`: Optional malware scanning for uploads

## 🎯 Features

### For Vendors
- Submit new orders with file attachments
- Track order status in real-time
- Receive automatic status updates

### For Jonan (Admin)
- Dashboard with all active orders
- Update order status (New → Prepping → Printing → Finished → Ready → Delivered)
- Manage users and permissions
- Configure webhooks for external automation
- Delete orders when needed

### For Administrators
- Full user management
- Webhook configuration
- System administration

## 🔐 User Roles

- **Vendor**: Can create orders and view their own orders
- **Jonan**: Can manage all orders and update statuses
- **Admin**: Full system access including user management and webhooks

## 🌐 Access

- **Frontend**: http://printshop.localhost (via Traefik)
- **Backend API**: http://printshop.localhost/api/ (proxied through frontend)
- **Database**: Internal only (accessible within Docker network)

## 📋 Default Login

- **Admin**: `admin@example.com` / `admin`
- **Jonan**: `jonan@example.com` / `jonan`

## 🔧 Development

The application runs entirely in Docker containers with local volume persistence. All data survives container restarts.

### Database Setup
The database is automatically initialized with the required tables and a default admin user.

### File Storage
Uploaded files are stored in `./data/uploads/` and organized by order ID.

### Webhooks
Configure webhooks to send notifications to external systems when orders are created or status changes.

## 🚀 Production Deployment

1. Update the `SECRET_KEY` in `docker-compose.yml`
2. Configure proper database credentials
3. Set up SSL/TLS for HTTPS
4. Configure webhook endpoints
5. Set up monitoring and backups

## 📁 Project Structure

```
├── backend/           # FastAPI backend
│   ├── routers/       # API endpoints
│   ├── models.py      # Database models
│   └── auth.py        # Authentication
├── frontend/          # React frontend
│   ├── src/
│   │   ├── pages/     # React pages
│   │   ├── components/ # React components
│   │   └── services/  # API services
├── docker-compose.yml # Docker configuration
└── README.md
```

## 🤝 Contributing

This is a private project for Jonan's Print Shop. For issues or feature requests, please contact the maintainer.

## 📄 License

Private project - All rights reserved.
