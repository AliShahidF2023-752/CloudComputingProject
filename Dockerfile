# Use Python 3.10 slim as base
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies and Chrome
# 1. Install basics
# 2. Install Chrome keys and repo
# 3. Install Chrome
# 4. Clean up
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    unzip \
    build-essential \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install all Python dependencies
# Includes PyTorch (CPU) and Selenium
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -m nltk.downloader punkt punkt_tab

# Copy application code and model files
COPY . .

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Expose ports for both services
EXPOSE 1234 5000

# Environment variables
ENV PYTHONUNBUFFERED=1

# Run the entrypoint script
CMD ["./entrypoint.sh"]
