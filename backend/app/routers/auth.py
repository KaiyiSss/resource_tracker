from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["auth"])


@router.get("/me")
def get_current_user():
    # TODO: wire up real auth (OAuth/SSO); returning a stub for now
    return {"id": "stub-user", "name": "Delivery Lead", "role": "delivery_lead"}
