# Base image
FROM python:3.10-slim

# Working directory
WORKDIR /app

# Install system dependencies if needed (e.g. for some pip packages)
# RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy logic
COPY app.py .

# Expose port
EXPOSE 5000

# Start command
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
