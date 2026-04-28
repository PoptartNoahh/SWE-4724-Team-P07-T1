# CCSE Capstone Meeting Intelligence Platform (CCSE-MIP)

Full-stack app:
- **Backend**: FastAPI (`backend/main.py`) + Azure SQL (via `pyodbc`)
- **Frontend**: React + Vite (`mi-platform/`)

## Prerequisites

### Backend
- **Python**: `3.13.2`
- **ODBC Driver**: Microsoft **ODBC Driver 18 for SQL Server** (required for `pyodbc`)

### Frontend
- **Node.js**: recent LTS recommended
- **npm**: comes with Node

## Repo layout
- `backend/`: FastAPI app
- `mi-platform/`: Vite + React frontend
- `requirements.txt`: backend Python dependencies

## Backend setup (Windows)

### 1) Create & activate a virtual environment

```powershell
uv venv --python 3.13.2
# or
py -m uv venv --python 3.13.2

.\.venv\Scripts\Activate.ps1
```

### 2) Install dependencies

```powershell
pip install -r "requirements.txt"
# or
py -m pip install -r "requirements.txt"
```

### 3) Configure environment variables

Create `backend/.env` (do not commit it) with:

```env
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database
DB_USER=your-username
DB_PASSWORD=your-password

# optional: frontend dev origin(s)
# CORS_ALLOW_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Notes:
- `backend/main.py` reads `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- `CORS_ALLOW_ORIGINS` defaults to `http://localhost:5173` (and common variants).

### 4) Run the backend

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

Sanity check:
- `GET http://localhost:8000/api/ping` should return a plain text message.

## Frontend setup (Vite)

### 1) Install dependencies

```powershell
cd mi-platform
npm install
```

### 2) (Optional) Point frontend at backend

Create `mi-platform/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3) Run the frontend

```powershell
npm run dev
```

Then open the URL.

## Running both (recommended order)
- Start the **backend**
- Start the **frontend** (Vite)

## Common issues

### `pyodbc` / SQL Server driver errors
- Install **ODBC Driver 18 for SQL Server** and restart your terminal.
- Confirm your `backend/.env` credentials and that your Azure SQL firewall allows your IP.

### CORS errors
- Set `CORS_ALLOW_ORIGINS` in `backend/.env` to include your frontend origin (e.g. `http://localhost:5173`).

