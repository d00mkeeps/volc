import os
import logging
from fastapi import APIRouter, Header, HTTPException, Depends, status
from app.services.admin.analytics_aggregator import analytics_aggregator

logger = logging.getLogger(__name__)
router = APIRouter()


async def verify_admin_dashboard_key(x_admin_key: str = Header(None)):
    """
    Security check for admin dashboard endpoints.
    Requires matching ADMIN_DASHBOARD_KEY or ADMIN_TEST_KEY.
    """
    expected_key = (
        os.environ.get("ADMIN_DASHBOARD_KEY")
        or os.environ.get("ADMIN_TEST_KEY")
        or "volc-admin-secret"
    )
    if not x_admin_key or x_admin_key != expected_key:
        logger.warning("Unauthorized admin dashboard access attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid admin key",
        )
    return True


@router.get("/api/admin/dashboard/metrics")
async def get_dashboard_metrics(_=Depends(verify_admin_dashboard_key)):
    """
    Retrieve current cached admin analytics metrics for the 3 dashboard tabs.
    """
    try:
        return await analytics_aggregator.get_metrics(force_refresh=False)
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/admin/dashboard/refresh")
async def refresh_dashboard_metrics(_=Depends(verify_admin_dashboard_key)):
    """
    Force an immediate recalculation of all analytics metrics.
    """
    try:
        return await analytics_aggregator.refresh_metrics()
    except Exception as e:
        logger.error(f"Error refreshing dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
