# Use a slim Python base image for a smaller footprint
FROM python:3.12-slim

# Set working directory inside the container
WORKDIR /app

# Install system-level dependencies. 
# Adjust these based on your project's needs
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy ONLY the requirements file first. 
# This optimizes Docker's layer caching so dependencies aren't re-downloaded unless this file changes.
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port your web framework runs on
EXPOSE 8000

# Ensure Python outputs everything directly to the terminal (no buffering), useful for viewing logs
ENV PYTHONUNBUFFERED=1

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
