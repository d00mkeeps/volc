# from fastapi import Request, HTTPException, status
# from typing import Optional
# import logging

# logger = logging.getLogger(__name__)

# # def extract_jwt_from_request(request: Request) -> Optional[str]:
#     """
#     Extract JWT token from FastAPI request headers.
    
#     Args:
#         request: FastAPI Request object
        
#     Returns:
#         JWT token string or None if not found
#     """
#     try:
#         auth_header = request.headers.get('Authorization', '')
        
#         if not auth_header:
#             logger.debug("No Authorization header found")
#             return None
            
#         if not auth_header.startswith('Bearer '):
#             logger.warning(f"Invalid Authorization header format: {auth_header[:20]}...")
#             return None
            
#         token = auth_header.replace('Bearer ', '', 1).strip()
        
#         if not token:
#             logger.warning("Empty token in Authorization header")
#             return None
            
#         logger.debug(f"Successfully extracted JWT token (length: {len(token)})")
#         return token
        
#     except Exception as e:
#         logger.error(f"Error extracting JWT from request: {str(e)}")
#         return None

# def require_jwt_from_request(request: Request) -> str:
#     """
#     Extract JWT token from request and raise HTTPException if not found.
    
#     Args:
#         request: FastAPI Request object
        
#     Returns:
#         JWT token string
        
#     Raises:
#         HTTPException: If no valid JWT token is found
#     """
#     token = extract_jwt_from_request(request)
    
#     if not token:
#         logger.warning("JWT token required but not found in request")
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Valid JWT token required",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
    
#     return token

# def validate_jwt_format(token: str) -> bool:
#     """
#     Basic validation of JWT token format (does not verify signature).
    
#     Args:
#         token: JWT token string
        
#     Returns:
#         True if token appears to be valid JWT format
#     """
#     try:
#         if not token or not isinstance(token, str):
#             return False
            
#         # JWT should have 3 parts separated by dots
#         parts = token.split('.')
#         if len(parts) != 3:
#             return False
            
#         # Each part should be non-empty
#         if not all(part.strip() for part in parts):
#             return False
            
#         # Basic length check - JWTs are typically quite long
#         if len(token) < 100:
#             return False
            
#         return True
        
#     except Exception as e:
#         logger.error(f"Error validating JWT format: {str(e)}")
#         return False

# class JWTContextManager:
#     """
#     Helper class for managing JWT context across service operations.
#     """
    
#     def __init__(self, jwt_token: Optional[str] = None):
#         self.jwt_token = jwt_token
#         self.is_valid = validate_jwt_format(jwt_token) if jwt_token else False
        
#     def has_valid_token(self) -> bool:
#         """Check if manager has a valid JWT token."""
#         return self.is_valid and self.jwt_token is not None
        
#     def get_token(self) -> Optional[str]:
#         """Get the JWT token if valid."""
#         return self.jwt_token if self.has_valid_token() else None
        
#     def require_token(self) -> str:
#         """Get JWT token or raise exception."""
#         if not self.has_valid_token():
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Valid JWT token required for this operation",
#                 headers={"WWW-Authenticate": "Bearer"},
#             )
#         return self.jwt_token