# Use the official Python lightweight image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

# Create and set working directory
WORKDIR /app

# Install system dependencies (e.g., if needed for certain audio/video packages)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements list
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend application
COPY . .

# Expose the port Cloud Run uses
EXPOSE 8080

# Command to run the application (Bind to $PORT for Cloud Run compatibility)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
