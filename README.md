# CSV Collaborative Data Manager

React + TypeScript frontend and Node.js + TypeScript backend

## CSV schema

- `postId`
- `id` — unique identifier
- `name`
- `email`
- `body`

The parser handles the UTF-8 BOM present in the supplied CSV.

## Features

- CSV upload with progress
- 10 MB upload limit
- CSV schema and record validation
- Duplicate ID validation
- SQLite persistence
- Server-side pagination and search
- Responsive table
- Socket.IO real-time collaboration
- Conflict detection and field-level diff
- Keep Old / Keep New conflict resolution
- Jest tests

## Run

### Backend

```bash
cd backend
npm install
npm run dev
```

Runs on http://localhost:3000.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173.

Use the supplied `data.csv` from the project root to test uploads.

## Production hardening

For production, add authentication/authorization, PostgreSQL, Redis Socket.IO adapter for multiple backend instances, streaming CSV processing, optimistic locking/version checks, audit history, and rate limiting.
