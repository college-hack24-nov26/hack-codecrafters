
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import (
    batches,
    sensor_readings,
    incidents,
    qc_records,
    decisions,
    facilities,
    diversions,
    alerts,
    audit_logs,
)

app = FastAPI(
    title="DairySync API",
    description="Cold-Chain Incident-to-Decision Support Platform",
    version="1.0.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(batches.router)
app.include_router(sensor_readings.router)
app.include_router(incidents.router)
app.include_router(qc_records.router)
app.include_router(decisions.router)
app.include_router(facilities.router)
app.include_router(diversions.router)
app.include_router(alerts.router)
app.include_router(audit_logs.router)


@app.get("/")
def home():
    return {
        "message": "Welcome to DairySync API",
        "project": "DairySync",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "DairySync",
        "version": "1.0.0",
    }
