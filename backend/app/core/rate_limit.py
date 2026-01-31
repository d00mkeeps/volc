from functools import wraps
from fastapi import HTTPException, status
from app.services.rate_limiter import rate_limiter
import logging
import inspect

logger = logging.getLogger(__name__)


def rate_limit(action_type: str):
    """
    Decorator to apply rate limiting to API endpoints

    Usage: @rate_limit("conversation_create")

    Expects endpoint to have 'user' and 'jwt_token' parameters from dependencies
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                # Extract user and jwt_token from function parameters
                user = None
                jwt_token = None

                # Get function signature to find parameter names
                sig = inspect.signature(func)
                bound_args = sig.bind(*args, **kwargs)
                bound_args.apply_defaults()

                # Look for user and jwt_token in bound arguments
                for param_name, param_value in bound_args.arguments.items():
                    if param_name == "user" and hasattr(param_value, "id"):
                        user = param_value
                    elif param_name == "jwt_token" and isinstance(param_value, str):
                        jwt_token = param_value

                if not user or not jwt_token:
                    logger.error(
                        f"Rate limit decorator missing required parameters. user: {user is not None}, jwt_token: {jwt_token is not None}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Rate limiting configuration error",
                    )

                # Check rate limit
                result = await rate_limiter.check_rate_limit(
                    user.id, action_type, jwt_token
                )

                if not result.get("success", False):
                    logger.error(f"Rate limiter error: {result.get('error')}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Rate limiting error",
                    )

                rate_limit_data = result["data"]

                if not rate_limit_data["allowed"]:
                    # Rate limit exceeded
                    logger.info(
                        f"Rate limit exceeded for user {user.id}, action {action_type}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Rate limit exceeded. Try again at {rate_limit_data['reset_at']}",
                        headers={
                            "X-RateLimit-Limit": str(
                                rate_limit_data.get("remaining", 0) + 1
                            ),
                            "X-RateLimit-Remaining": str(rate_limit_data["remaining"]),
                            "X-RateLimit-Reset": rate_limit_data["reset_at"],
                        },
                    )

                # Rate limit passed - add headers and continue
                logger.debug(
                    f"Rate limit check passed for user {user.id}, action {action_type}. Remaining: {rate_limit_data['remaining']}"
                )

                # Execute the original function
                response = await func(*args, **kwargs)

                # Note: In a real implementation, you might want to add rate limit headers to the response
                # For now, we'll just let the request proceed normally

                return response

            except HTTPException:
                # Re-raise HTTP exceptions (rate limit exceeded, etc.)
                raise
            except Exception as e:
                logger.error(f"Unexpected error in rate limit decorator: {str(e)}")
                # Don't block requests due to rate limiting errors - fail open
                return await func(*args, **kwargs)

        return wrapper

    return decorator
