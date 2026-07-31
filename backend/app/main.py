from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, capacity, holidays, jira, pods, sprints, staff

app = FastAPI(title="Resource Tracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(staff.router)
app.include_router(pods.router)
app.include_router(sprints.router)
app.include_router(jira.router)
app.include_router(holidays.router)
app.include_router(capacity.router)


@app.get("/health")
def health():
    return {"status": "ok"}
