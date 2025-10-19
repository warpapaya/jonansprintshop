# Jonan's Print Shop

A self-hosted, dockerized web application for managing 3D-printed clay cutter orders between vendors and Jonan.

## Quick Start

```bash
# Start the application
docker compose up -d

# View logs
docker compose logs -f

# Stop the application
docker compose down
```

## Architecture

- **Backend**: FastAPI (Python) with PostgreSQL
- **Frontend**: React + Vite with TailwindCSS
- **Database**: PostgreSQL with local volume persistence
- **Storage**: Local file uploads in `/data/uploads`
- **Authentication**: JWT-based with role-based access control

## Services

- `db`: PostgreSQL database
- `backend`: FastAPI application
- `frontend`: React application served by Nginx
- `clamav`: Optional malware scanning for uploads

## Development

The application runs entirely in Docker containers with local volume persistence. All data survives container restarts.

## Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Database: localhost:5432 (internal only)
