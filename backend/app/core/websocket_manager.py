"""
WebSocket connection manager.
Handles connection lifecycle, heartbeat monitoring, and timeout detection.
"""
import asyncio
import logging
from typing import Dict, Optional, Callable
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionInfo:
    """Metadata for a WebSocket connection"""
    def __init__(self, connection_id: str, user_id: str, conversation_id: str):
        self.connection_id = connection_id
        self.user_id = user_id
        self.conversation_id = conversation_id
        self.connected_at = datetime.now()
        self.last_heartbeat = asyncio.get_event_loop().time()
        self.on_timeout_callback: Optional[Callable] = None

class WebSocketManager:
    """
    Manages WebSocket connections and heartbeat monitoring.
    Thread-safe singleton for tracking all active connections.
    """
    
    HEARTBEAT_CHECK_INTERVAL = 5  # Check every 5 seconds
    HEARTBEAT_TIMEOUT = 30        # Timeout after 30 seconds
    
    def __init__(self):
        self.connections: Dict[str, ConnectionInfo] = {}
        self.monitor_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()
    
    async def register_connection(
        self,
        connection_id: str,
        user_id: str,
        conversation_id: str,
        on_timeout: Optional[Callable] = None
    ) -> None:
        """
        Register a new WebSocket connection.
        
        Args:
            connection_id: Unique identifier for this connection
            user_id: User ID
            conversation_id: Conversation ID
            on_timeout: Callback to call if connection times out
        """
        async with self._lock:
            conn_info = ConnectionInfo(connection_id, user_id, conversation_id)
            conn_info.on_timeout_callback = on_timeout
            self.connections[connection_id] = conn_info
            
            logger.info(f"📝 Registered connection: {connection_id} (total: {len(self.connections)})")
            
            # Start monitor if not running
            if self.monitor_task is None or self.monitor_task.done():
                self.monitor_task = asyncio.create_task(self._monitor_heartbeats())
    
    async def update_heartbeat(self, connection_id: str) -> None:
        """
        Update the last heartbeat timestamp for a connection.
        
        Args:
            connection_id: Connection identifier
        """
        async with self._lock:
            if connection_id in self.connections:
                self.connections[connection_id].last_heartbeat = asyncio.get_event_loop().time()
    
    async def unregister_connection(self, connection_id: str) -> None:
        """
        Unregister a WebSocket connection.
        
        Args:
            connection_id: Connection identifier
        """
        async with self._lock:
            if connection_id in self.connections:
                del self.connections[connection_id]
                logger.info(f"🗑️ Unregistered connection: {connection_id} (remaining: {len(self.connections)})")
    
    def get_active_count(self) -> int:
        """Get number of active connections"""
        return len(self.connections)
    
    def get_connection_info(self, connection_id: str) -> Optional[ConnectionInfo]:
        """Get connection metadata"""
        return self.connections.get(connection_id)
    
    async def _monitor_heartbeats(self) -> None:
        """Background task to monitor all connections for timeouts"""
        logger.info("🔍 Starting heartbeat monitor")
        
        try:
            while True:
                await asyncio.sleep(self.HEARTBEAT_CHECK_INTERVAL)
                
                current_time = asyncio.get_event_loop().time()
                timed_out = []
                
                async with self._lock:
                    for conn_id, conn_info in self.connections.items():
                        elapsed = current_time - conn_info.last_heartbeat
                        
                        if elapsed > self.HEARTBEAT_TIMEOUT:
                            logger.warning(
                                f"⏰ Connection timeout: {conn_id} "
                                f"(last heartbeat: {elapsed:.1f}s ago)"
                            )
                            timed_out.append((conn_id, conn_info))
                
                # Call timeout callbacks outside lock
                for conn_id, conn_info in timed_out:
                    if conn_info.on_timeout_callback:
                        try:
                            await conn_info.on_timeout_callback()
                        except Exception as e:
                            logger.error(f"Error in timeout callback for {conn_id}: {e}")
                    
                    await self.unregister_connection(conn_id)
                
                # Stop monitoring if no connections
                if len(self.connections) == 0:
                    logger.info("🛑 No active connections - stopping heartbeat monitor")
                    break
        
        except asyncio.CancelledError:
            logger.info("Heartbeat monitor cancelled")
        except Exception as e:
            logger.error(f"Error in heartbeat monitor: {e}", exc_info=True)

# Module-level singleton
_manager_instance: Optional[WebSocketManager] = None

def get_websocket_manager() -> WebSocketManager:
    """Get the WebSocketManager singleton instance"""
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = WebSocketManager()
    return _manager_instance
