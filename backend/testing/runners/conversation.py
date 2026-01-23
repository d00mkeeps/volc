"""
Conversation Runner

Orchestrates conversations between PersonaSimulator and Coach via WebSocket.
Replicates production WebSocket protocol for realistic testing.
"""
import asyncio
import json
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

import websockets
from websockets.exceptions import ConnectionClosed

from ..personas.simulator import PersonaSimulator
from ..personas.config import get_persona

logger = logging.getLogger(__name__)

# Error log file for debugging
LOG_DIR = Path(__file__).parent.parent / "logs"
ERROR_LOG_FILE = LOG_DIR / "conversation_errors.log"


def _log_error(persona_name: str, error: str, context: Optional[Dict] = None):
    """Log error to dedicated file for debugging"""
    LOG_DIR.mkdir(exist_ok=True)
    
    timestamp = datetime.utcnow().isoformat()
    entry = {
        "timestamp": timestamp,
        "persona": persona_name,
        "error": error,
        "context": context or {}
    }
    
    with open(ERROR_LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    
    logger.error(f"[{persona_name}] {error}")


def _generate_greeting(first_name: str, user_id: str, is_new_user: bool) -> str:
    """
    Generate client-side greeting (replicates ChatStore.computeGreeting).
    
    Args:
        first_name: User's first name
        user_id: User ID for stable randomization
        is_new_user: Whether user has AI memory notes
        
    Returns:
        Greeting string
    """
    # Stable random based on user_id (matches client logic)
    def stable_random(max_val: int) -> int:
        hash_val = 0
        for char in user_id:
            hash_val = ((hash_val << 5) - hash_val + ord(char)) & 0xFFFFFFFF
        return abs(hash_val) % max_val
    
    if is_new_user:
        if first_name:
            return f"Welcome to Volc, {first_name}! I'm excited to work with you. To start, what's one of your main fitness goals?"
        return "Welcome to Volc! I'm excited to work with you. To start, what's one of your main fitness goals?"
    
    # Time-based greeting for existing users
    hour = datetime.now().hour
    
    if 5 <= hour < 12:
        options = [
            f"Good morning, {first_name}. Ready to plan a workout or review your progress?",
            f"Morning, {first_name}! Want to plan today's session or check how your training's going?",
            f"Hey {first_name}, morning! I can help plan a workout, analyze your progress, or talk recovery.",
        ]
    elif 12 <= hour < 17:
        options = [
            f"Good afternoon, {first_name}. Need help planning a session or reviewing your training?",
            f"Hey {first_name}! Want to plan a workout, check your progress, or optimize recovery?",
            f"Afternoon, {first_name}. Let's plan your next workout or see how you're progressing.",
        ]
    else:
        options = [
            f"Evening, {first_name}. Time to plan tomorrow's workout or review today's training?",
            f"Hey {first_name}, good evening! Want to prep for tomorrow or check your recent progress?",
            f"Evening, {first_name}. I can help plan your next session or analyze your training.",
        ]
    
    return options[stable_random(len(options))]


async def run_conversation(
    persona_name: str,
    user_id: str,
    conversation_id: str,
    credentials,
    project_id: str,
    host: str = "localhost:8000"
) -> Dict[str, Any]:
    """
    Run a complete conversation between a persona and the coach.
    
    Args:
        persona_name: Name of persona ('margaret', 'jake', 'sarah', 'brian')
        user_id: Auth user UUID
        conversation_id: Conversation UUID
        credentials: GCP credentials for PersonaSimulator
        project_id: GCP project ID
        host: Backend host:port
        
    Returns:
        {
            'persona': str,
            'status': 'approved' | 'quit' | 'max_messages' | 'error',
            'message_count': int,
            'transcript': List[{'role': str, 'content': str}],
            'latencies': List[{'total': float, 'ttft': float}],
            'avg_latency': float,
            'avg_ttft': float
        }
    """
    # Get persona config
    persona_config = get_persona(persona_name)
    if not persona_config:
        return {
            "persona": persona_name,
            "status": "error",
            "message_count": 0,
            "transcript": [],
            "error": f"Unknown persona: {persona_name}"
        }
    
    # Initialize simulator
    simulator = PersonaSimulator(
        persona_name=persona_name,
        credentials=credentials,
        project_id=project_id
    )
    
    # Build WebSocket URL
    ws_url = f"ws://{host}/api/llm/coach/{conversation_id}/{user_id}"
    
    # Transcript and latency tracking
    transcript = []
    latencies = []
    message_count = 0
    max_messages = 21  # greeting + 20 exchanges
    
    # Retry config
    max_retries = 3
    retry_delay = 2.0
    
    for attempt in range(max_retries):
        try:
            return await _run_conversation_inner(
                ws_url=ws_url,
                simulator=simulator,
                persona_config=persona_config,
                user_id=user_id,
                transcript=transcript,
                max_messages=max_messages
            )
        
        except ConnectionClosed as e:
            _log_error(persona_name, f"WebSocket closed (attempt {attempt + 1}): {e}", {
                "code": e.code,
                "reason": str(e.reason) if e.reason else None
            })
            
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay)
                continue
            
            return {
                "persona": persona_name,
                "status": "error",
                "message_count": len(transcript),
                "transcript": transcript,
                "error": f"WebSocket closed after {max_retries} attempts: {e}"
            }
        
        except Exception as e:
            _log_error(persona_name, f"Error (attempt {attempt + 1}): {str(e)}", {
                "type": type(e).__name__
            })
            
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay)
                continue
            
            return {
                "persona": persona_name,
                "status": "error",
                "message_count": len(transcript),
                "transcript": transcript,
                "error": f"Failed after {max_retries} attempts: {str(e)}"
            }
    
    # Should not reach here
    return {
        "persona": persona_name,
        "status": "error",
        "message_count": len(transcript),
        "transcript": transcript,
        "error": "Unexpected exit from retry loop"
    }


async def _run_conversation_inner(
    ws_url: str,
    simulator: PersonaSimulator,
    persona_config: Dict[str, Any],
    user_id: str,
    transcript: list,
    max_messages: int
) -> Dict[str, Any]:
    """
    Inner conversation loop (extracted for retry logic).
    """
    persona_name = simulator.persona_name
    first_name = persona_config.get("profile", {}).get("first_name", "")
    latencies = []  # Track timing for each coach response
    
    # Check if new user (no AI memory notes)
    ai_memory = persona_config.get("ai_memory", {})
    notes = ai_memory.get("notes", [])
    is_new_user = len(notes) == 0
    
    async with websockets.connect(ws_url) as ws:
        logger.info(f"[{persona_name}] Connected to {ws_url}")
        
        # Start heartbeat task
        heartbeat_task = asyncio.create_task(_heartbeat_loop(ws, persona_name))
        
        try:
            # Wait for connection confirmation
            raw_msg = await asyncio.wait_for(ws.recv(), timeout=10.0)
            msg = json.loads(raw_msg)
            
            if msg.get("type") != "connection_status":
                logger.warning(f"[{persona_name}] Unexpected first message: {msg}")
            
            # Generate greeting (client-side, as persona's "assistant" first message)
            greeting = _generate_greeting(first_name, user_id, is_new_user)
            transcript.append({"role": "assistant", "content": greeting})
            
            logger.info(f"[{persona_name}] Greeting: {greeting[:50]}...")
            
            # Get persona's first response to greeting
            persona_response = await simulator.generate_response(greeting)
            transcript.append({"role": "user", "content": persona_response})
            
            # Check for stop signals
            if persona_response.strip().upper() == "APPROVE":
                return _build_result(persona_name, "approved", transcript, latencies)
            if persona_response.strip().upper() == "QUIT":
                return _build_result(persona_name, "quit", transcript, latencies)
            
            # Main conversation loop
            while len(transcript) < max_messages:
                # Send persona message to coach
                await ws.send(json.dumps({
                    "type": "message",
                    "message": persona_response
                }))
                
                # Collect streamed response with timing
                coach_response, timing = await _receive_coach_response(ws, persona_name)
                
                if coach_response is None:
                    logger.warning(f"[{persona_name}] No coach response received")
                    break
                
                if timing:
                    latencies.append(timing)
                    logger.info(f"[{persona_name}] Response time: {timing['total']:.2f}s (TTFT: {timing['ttft']:.2f}s)")
                
                transcript.append({"role": "assistant", "content": coach_response})
                logger.info(f"[{persona_name}] Coach: {coach_response[:80]}...")
                
                # Check simulator stop condition
                if simulator.should_stop():
                    logger.info(f"[{persona_name}] Simulator stop condition reached")
                    return _build_result(persona_name, "max_messages", transcript, latencies)
                
                # Generate persona response
                persona_response = await simulator.generate_response(coach_response)
                transcript.append({"role": "user", "content": persona_response})
                
                logger.info(f"[{persona_name}] Persona: {persona_response[:50]}...")
                
                # Check for stop signals
                if persona_response.strip().upper() == "APPROVE":
                    return _build_result(persona_name, "approved", transcript, latencies)
                if persona_response.strip().upper() == "QUIT":
                    return _build_result(persona_name, "quit", transcript, latencies)
            
            # Hit max messages
            return _build_result(persona_name, "max_messages", transcript, latencies)
        
        finally:
            # Cancel heartbeat
            heartbeat_task.cancel()
            try:
                await heartbeat_task
            except asyncio.CancelledError:
                pass


async def _heartbeat_loop(ws, persona_name: str):
    """Send heartbeat every 20 seconds"""
    try:
        while True:
            await asyncio.sleep(20)
            await ws.send(json.dumps({
                "type": "heartbeat",
                "timestamp": time.time()
            }))
            logger.debug(f"[{persona_name}] Heartbeat sent")
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.warning(f"[{persona_name}] Heartbeat error: {e}")


async def _receive_coach_response(ws, persona_name: str, timeout: float = 120.0) -> tuple:
    """
    Receive and assemble streamed coach response.
    
    Args:
        ws: WebSocket connection
        persona_name: For logging
        timeout: Max wait time for response
        
    Returns:
        Tuple of (response_text, timing_dict) where timing_dict has 'total' and 'ttft' keys
    """
    response_chunks = []
    start_time = time.time()
    first_token_time = None
    
    try:
        while True:
            # Check timeout
            if time.time() - start_time > timeout:
                logger.warning(f"[{persona_name}] Response timeout after {timeout}s")
                total = time.time() - start_time
                ttft = first_token_time - start_time if first_token_time else total
                return "".join(response_chunks) if response_chunks else None, {"total": total, "ttft": ttft}
            
            try:
                raw_msg = await asyncio.wait_for(ws.recv(), timeout=30.0)
            except asyncio.TimeoutError:
                # No message in 30s, might be slow LLM
                continue
            
            msg = json.loads(raw_msg)
            msg_type = msg.get("type")
            
            if msg_type == "content":
                chunk = msg.get("data", "")
                if first_token_time is None:
                    first_token_time = time.time()
                response_chunks.append(chunk)
            
            elif msg_type == "complete":
                total = time.time() - start_time
                ttft = first_token_time - start_time if first_token_time else total
                return "".join(response_chunks), {"total": total, "ttft": ttft}
            
            elif msg_type == "heartbeat_ack":
                # Ignore heartbeat acks
                continue
            
            elif msg_type == "error":
                error_data = msg.get("data", {})
                _log_error(persona_name, f"Coach error: {error_data}")
                total = time.time() - start_time
                ttft = first_token_time - start_time if first_token_time else total
                return None, {"total": total, "ttft": ttft}
            
            elif msg_type == "cancelled":
                logger.warning(f"[{persona_name}] Response cancelled")
                total = time.time() - start_time
                ttft = first_token_time - start_time if first_token_time else total
                return "".join(response_chunks) if response_chunks else None, {"total": total, "ttft": ttft}
            
            else:
                logger.debug(f"[{persona_name}] Ignoring message type: {msg_type}")
    
    except Exception as e:
        _log_error(persona_name, f"Error receiving response: {str(e)}")
        total = time.time() - start_time
        ttft = first_token_time - start_time if first_token_time else total
        return "".join(response_chunks) if response_chunks else None, {"total": total, "ttft": ttft}


def _build_result(persona_name: str, status: str, transcript: list, latencies: list = None) -> Dict[str, Any]:
    """Build standardized result dict with latency metrics"""
    latencies = latencies or []
    
    # Calculate averages
    avg_latency = sum(l["total"] for l in latencies) / len(latencies) if latencies else 0
    avg_ttft = sum(l["ttft"] for l in latencies) / len(latencies) if latencies else 0
    
    return {
        "persona": persona_name,
        "status": status,
        "message_count": len(transcript),
        "transcript": transcript,
        "latencies": latencies,
        "avg_latency": avg_latency,
        "avg_ttft": avg_ttft
    }
