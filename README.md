# Volc - AI Coaching Platform
[App Store badge/link placeholder]

## Overview

**Volc** is an advanced AI-powered fitness coaching platform designed to provide hyper-personalized, real-time workout guidance. It utilizes an agentic architecture to act as a proactive coach tracking user performance, managing long-term progression, and adapting workout plans on the fly.

Using a WebSocket-first approach, the platform delivers sub-second latency for coaching interactions, streaming complex workout plans and real-time advice while managing state across a distributed system.

## Key Technical Features

### 🚀 Real-time WebSocket Streaming
Engineered for **sub-second latency**, typical HTTP overhead is eliminated by maintaining persistent WebSocket connections. This enables:
- **Instantaneous feedback loops** during workouts.
- **Bi-directional data streaming** (interleaving text tokens with structured JSON payloads).
- **Graceful connection recovery** with state reconciliation.

### 🧠 Two-Tier Memory Architecture
To solve the "context window" problem and reduce token costs by **95%**, Volc implements a novel memory system:
1.  **Short-Term Context**: Manages immediate conversation history for coherence.
2.  **Long-Term Semantic Memory**: An asynchronous background service (`MemoryExtractionService`) analyzes completed conversations to extract and index key user insights (injuries, preferences, PRs).
    *   *Result*: The LLM "remembers" facts from months ago without processing redundant chat logs.

### 🤖 Agentic Workflow System
The backend orchestrates a parallel execution pipeline:
- **Semantic Router**: A lightweight "Router" model (`Gemini 2.5 Flash Lite`) intercepts user intents to select appropriate tools (e.g., `get_exercises_by_muscle_groups`).
- **Parallel Execution**: Tools execute concurrently via `asyncio.gather`, minimizing wait times.
- **Unified Context Injection**: Tool results, user profile, and memory are dynamically injected into the system prompt before the final generation step.

### ⚡ Stream-Interception Pattern
To deliver rich UIs (charts, workout cards) without breaking the conversational flow, the system uses a custom **Stream-Interception Pattern**:
- The backend streams natural language tokens immediately to the client.
- Structured data (workouts, charts) is generated as JSON blocks within history keyframes.
- The frontend parser detects these blocks in real-time within the stream, suppressing the raw JSON and rendering native React Native components (via `Zustand` store updates) instead.

## Architecture

The system is built on an **Event-Driven Architecture** centered around high-performance handling of coaching sessions.

### Backend (`/backend`)
- **Orchestration Layer**: **FastAPI** handles WebSocket connections and HTTP endpoints.
- **Intelligence Engine**: **LangChain** + **Google Vertex AI** (Gemini 2.5 Flash) drives the cognitive logic.
- **Persistence**: **Supabase** (PostgreSQL) stores relational data (workouts, exercises, users) and JSONB documents (conversations).

### Frontend (`/app`)
- **Core**: React Native with Expo
- **State Management**: Zustand
- **UI Framework**: Tamagui
- **Navigation**: Expo Router + custom routing for swipe-between-tabs.

## Tech Stack

### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI, Uvicorn
- **AI/LLM**: LangChain, Google Vertex AI (Gemini 2.5 Flash / Flash Lite)
- **Database**: Supabase (PostgreSQL)
- **Infrastructure**: Railway (Deployment)

### Frontend
- **Framework**: React Native, Expo SDK 52
- **Language**: TypeScript
- **State**: Zustand
- **UI/Styling**: Tamagui
- **Visualization**: Victory Native (Charts)

## Key Implementation Details

### latency Optimization Strategies
To achieve a "chat-like" feel for complex coaching tasks:
- **Model Cascading**: We use a smaller, faster model (`Gemini 2.5 Flash Lite`) for routing and simple parts of the agentic process, reserving larger models for complex reasoning and final output.
- **Optimistic UI Updates**: The frontend displays "ghost" messages and states while the socket processes the request.

### Error Handling & Resilience
- **Exponential Backoff**: Custom retry logic for LLM rate limits and network instability.
- **Graceful Degradation**: If the "Memory" service is offline, the coach falls back to immediate context without crashing.
- **Socket Heartbeats**: Robust keep-alive and reconnection system to maintain sessions during screen locks/backgrounding.

## Development & Deployment

### CI/CD Pipeline
- **GitHub Actions**: Automated linting, type-checking (mypy/tsc), and testing (`pytest`).
- **Deployment**:
    - Backend automatically deploys to **Railway** on merge to `main`.
    - Frontend handles OTA updates via **Expo EAS Update**.
