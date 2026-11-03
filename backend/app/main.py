from fastapi import FastAPI

from .routers import batches


app = FastAPI(
    title="DairySync API",
    description="Cold-Chain Incident-to-Decision Support Platform",
    version="1.0.0"
)

# Register API routers
app.include_router(batches.router)


@app.get("/")
def home():
    return {
        "message": "Welcome to DairySync API",
        "project": "DairySync",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "DairySync",
        "version": "1.0.0"
    }