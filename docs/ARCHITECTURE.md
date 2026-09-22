# Volc AI Gym Coach Architecture & Topology

> *Auto-generated on every push via GitHub Actions. Do not edit manually.*  
> **Last Generated:** 2026-09-22 09:46:13 UTC

## Service Mesh Overview

```mermaid
graph TD
    subgraph Volcano_Host["Volcano Server (Docker Mesh)"]
        volc-backend["<b>supreme-octo-doodle-api</b><br/>Ports: 8002:8000"]
        volc-website["<b>volc-website</b><br/>Ports: 3004:3000"]
        volc-network["<b>volc-network</b><br/>Internal only"]
    end

    External[Client / Ingress] --> Volcano_Host
```

---

## Container Specifications

| Container Name | Service Name | Mapped Ports | Volumes | Memory Limit |
| :--- | :--- | :--- | :--- | :--- |
| `supreme-octo-doodle-api` | `volc-backend` | `8002:8000` | `"8002:8000"` | `unlimited` |
| `volc-website` | `volc-website` | `3004:3000` | `"3004:3000", NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-https, NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbml5dWRpcHdzYXF3dWhzZGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNDc5MDcsImV4cCI6MjAzNTgyMzkwN30.JZnzWXjTRSSvSiN4iK__QUY2DmXF2_wB27zjSG3THLs}, INTERNAL_API_URL=http://volc-backend, ADMIN_DASHBOARD_SECRET=${ADMIN_DASHBOARD_SECRET:-volc2026admin}, ADMIN_DASHBOARD_KEY=${ADMIN_DASHBOARD_KEY:-supreme-octo-doodle-secret-key-123}, ADMIN_TEST_KEY=${ADMIN_TEST_KEY:-supreme-octo-doodle-secret-key-123}` | `unlimited` |
| `volc-network` | `volc-network` | `None` | `None` | `unlimited` |
