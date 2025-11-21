from fastapi import APIRouter, Depends, HTTPException
from app.core.supabase.client import get_admin_client
from app.core.supabase.auth import get_current_user
import logging
from datetime import datetime, timedelta
from collections import defaultdict

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/api/admin/stats")
async def get_admin_stats(user = Depends(get_current_user)):
    """
    Get aggregated telemetry stats for the admin dashboard.
    Requires 'admin' permission_level.
    """
    try:
        supabase = get_admin_client()
        
        # Verify user permission
        profile_response = supabase.table("user_profiles")\
            .select("permission_level")\
            .eq("auth_user_uuid", user.id)\
            .single()\
            .execute()
            
        if not profile_response.data or profile_response.data.get("permission_level") != "admin":
            logger.warning(f"Unauthorized admin access attempt by user {user.id}")
            raise HTTPException(status_code=403, detail="Unauthorized: Admin access required")
        
        # Fetch logs for the last 24 hours
        # Note: In a real production app with millions of rows, you'd want to pre-aggregate this 
        # or use Supabase/Postgres aggregation queries directly. 
        # For now, fetching raw rows for last 24h is acceptable for MVP scale.
        
        # Calculate 24h ago timestamp
        # Supabase expects ISO string
        # We'll just fetch the last 1000 records to avoid blowing up memory if traffic spikes
        
        response = supabase.table("usage_logs")\
            .select("*")\
            .order("timestamp", desc=True)\
            .limit(1000)\
            .execute()
            
        logs = response.data
        
        if not logs:
            return {
                "total_requests": 0,
                "avg_latency": 0,
                "error_rate": 0,
                "top_endpoints": []
            }
            
        total_requests = len(logs)
        total_latency = sum(log["latency_ms"] for log in logs)
        avg_latency = int(total_latency / total_requests) if total_requests > 0 else 0
        
        error_count = sum(1 for log in logs if log["status_code"] >= 500)
        error_rate = round((error_count / total_requests) * 100, 1) if total_requests > 0 else 0
        
        # Group by endpoint
        endpoint_stats = defaultdict(lambda: {"count": 0, "latency_sum": 0, "history": []})
        
        for log in logs:
            path = log["path"]
            endpoint_stats[path]["count"] += 1
            endpoint_stats[path]["latency_sum"] += log["latency_ms"]
            # Keep simple history for charts (just latency for now)
            endpoint_stats[path]["history"].append({
                "timestamp": log["timestamp"],
                "latency": log["latency_ms"]
            })
            
        # Format top endpoints
        top_endpoints = []
        for path, stats in endpoint_stats.items():
            avg_lat = int(stats["latency_sum"] / stats["count"])
            top_endpoints.append({
                "path": path,
                "count": stats["count"],
                "avg_latency": avg_lat,
                "history": stats["history"][:50] # Limit history points sent to frontend
            })
            
        # Sort by count desc
        top_endpoints.sort(key=lambda x: x["count"], reverse=True)
        
        return {
            "total_requests": total_requests,
            "avg_latency": avg_latency,
            "error_rate": error_rate,
            "top_endpoints": top_endpoints[:10] # Top 10
        }
        
    except Exception as e:
        logger.error(f"Admin stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/admin/llm-stats")
async def get_llm_stats(user = Depends(get_current_user)):
    """
    Get LLM-specific performance metrics for the admin dashboard.
    Requires 'admin' permission_level.
    
    Returns:
        - Token statistics (input/output, averages, min/max)
        - Latency statistics (avg, P50, P95, P99)
        - Volume statistics (total requests, breakdown by model/endpoint)
    """
    try:
        supabase = get_admin_client()
        
        # Verify user permission
        profile_response = supabase.table("user_profiles")\
            .select("permission_level")\
            .eq("auth_user_uuid", user.id)\
            .single()\
            .execute()
            
        if not profile_response.data or profile_response.data.get("permission_level") != "admin":
            logger.warning(f"Unauthorized admin access attempt by user {user.id}")
            raise HTTPException(status_code=403, detail="Unauthorized: Admin access required")
        
        # Fetch LLM logs (last 1000 records)
        response = supabase.table("usage_logs")\
            .select("*")\
            .eq("endpoint_type", "llm")\
            .order("timestamp", desc=True)\
            .limit(1000)\
            .execute()
            
        logs = response.data
        
        if not logs:
            return {
                "token_stats": {
                    "total_input_tokens": 0,
                    "total_output_tokens": 0,
                    "avg_input_tokens": 0,
                    "avg_output_tokens": 0,
                    "max_input_tokens": 0,
                    "max_output_tokens": 0,
                },
                "latency_stats": {
                    "avg_latency": 0,
                    "p50_latency": 0,
                    "p95_latency": 0,
                    "p99_latency": 0,
                },
                "volume_stats": {
                    "total_requests": 0,
                    "requests_per_hour": [],
                    "by_model": [],
                    "by_endpoint": [],
                }
            }
        
        # Calculate token statistics
        input_tokens_list = [log["input_tokens"] for log in logs if log.get("input_tokens")]
        output_tokens_list = [log["output_tokens"] for log in logs if log.get("output_tokens")]
        
        token_stats = {
            "total_input_tokens": sum(input_tokens_list),
            "total_output_tokens": sum(output_tokens_list),
            "avg_input_tokens": int(sum(input_tokens_list) / len(input_tokens_list)) if input_tokens_list else 0,
            "avg_output_tokens": int(sum(output_tokens_list) / len(output_tokens_list)) if output_tokens_list else 0,
            "max_input_tokens": max(input_tokens_list) if input_tokens_list else 0,
            "max_output_tokens": max(output_tokens_list) if output_tokens_list else 0,
        }
        
        # Calculate latency statistics
        latencies = sorted([log["latency_ms"] for log in logs])
        n = len(latencies)
        
        latency_stats = {
            "avg_latency": int(sum(latencies) / n) if n > 0 else 0,
            "p50_latency": latencies[int(n * 0.50)] if n > 0 else 0,
            "p95_latency": latencies[int(n * 0.95)] if n > 0 else 0,
            "p99_latency": latencies[int(n * 0.99)] if n > 0 else 0,
        }
        
        # Calculate volume statistics
        from collections import Counter
        from datetime import datetime as dt
        
        # Group by model
        model_counts = Counter(log.get("model_name", "unknown") for log in logs)
        by_model = [{"model": model, "count": count} for model, count in model_counts.items()]
        
        # Group by endpoint (extract endpoint name from path)
        endpoint_counts = defaultdict(int)
        for log in logs:
            path = log.get("path", "")
            # Extract endpoint type from path like "/api/llm/workout-analysis/..."
            if "/api/llm/" in path:
                endpoint_type = path.split("/api/llm/")[1].split("/")[0]
                endpoint_counts[endpoint_type] += 1
        
        by_endpoint = [{"endpoint": endpoint, "count": count} for endpoint, count in endpoint_counts.items()]
        
        # Group by hour (last 24 hours)
        hourly_counts = defaultdict(int)
        for log in logs:
            timestamp_str = log.get("timestamp")
            if timestamp_str:
                # Parse timestamp and group by hour
                try:
                    timestamp = dt.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    hour_key = timestamp.strftime("%Y-%m-%d %H:00")
                    hourly_counts[hour_key] += 1
                except:
                    pass
        
        requests_per_hour = [{"hour": hour, "count": count} for hour, count in sorted(hourly_counts.items())]
        
        volume_stats = {
            "total_requests": len(logs),
            "requests_per_hour": requests_per_hour[-24:],  # Last 24 hours
            "by_model": by_model,
            "by_endpoint": by_endpoint,
        }
        
        return {
            "token_stats": token_stats,
            "latency_stats": latency_stats,
            "volume_stats": volume_stats,
        }
        
    except Exception as e:
        logger.error(f"LLM stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

