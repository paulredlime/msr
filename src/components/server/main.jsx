python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes_grocers import router as grocers_router

# --- 1. Main App Definition ---
app = FastAPI(title="Backend API")

# --- 2. CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # or your exact frontend origin
    allow_credentials=False,
    allow_methods=["GET","POST","OPTIONS"],
    allow_headers=["*"],
)

# --- 5. Include the Router in the App ---
# This assumes routes_grocers.py defines a router with a prefix like "/api"
# and contains all the grocers-related endpoints and their dependencies.
app.include_router(grocers_router)  # exposes /api/grocers/zyte and /api/grocers/zyte/
