# =========================
# Base image (CPU only)
# =========================
FROM python:3.10-slim

# =========================
# Environment variables
# =========================
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# HuggingFace / Transformers cache (local model only)
ENV TRANSFORMERS_CACHE=/app/model
ENV HF_HOME=/app/model

# =========================
# System dependencies
# =========================
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# =========================
# Working directory
# =========================
WORKDIR /app

# =========================
# Install CPU-only PyTorch
# =========================
RUN pip install --no-cache-dir \
    torch \
    --index-url https://download.pytorch.org/whl/cpu

# =========================
# Install remaining deps
# =========================
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# =========================
# Copy application code & model
# =========================
COPY . .

# =========================
# Expose API port
# =========================
EXPOSE 1234

# =========================
# Start FastAPI
# =========================
CMD ["uvicorn", "run:app", "--host", "0.0.0.0", "--port", "1234"]
