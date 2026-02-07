# How-to: Setup Local Backend

This guide walks you through setting up the Volc Python backend on your local machine for development and testing.

## Prerequisites

- **Python 3.10+**: Ensure you have a modern Python version installed.
- **Supabase Project**: You need a Supabase project for database and authentication.
- **Google Cloud Project**: Required for Gemini AI services.

## Initial Setup

1. **Clone the repository** (if you haven't already):

   ```bash
   git clone <repository-url>
   cd supreme-octo-doodle/backend
   ```

2. **Create a virtual environment**:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_or_service_role_key

# Google Cloud (Gemini) Configuration
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type": "service_account", ...}'

# Optional: Local Development
PORT=8000
LOG_LEVEL=info
```

> [!IMPORTANT]
> Ensure the `GOOGLE_APPLICATION_CREDENTIALS_JSON` contains the full JSON string of your service account key.

## Running the Server

Start the FastAPI server using `uvicorn`:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. You can view the interactive documentation (Swagger UI) at `http://localhost:8000/docs`.

## Verifying the Connection

Check the health endpoint to ensure environment variables are correctly loaded:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "api",
  "supabase_env": "ok"
}
```
