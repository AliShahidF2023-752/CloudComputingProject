# Use Node.js 20 (required for Next.js 16) on Debian Bookworm (stable)
FROM node:20-bookworm

# Allow pip to install system-wide packages (PEP 668)
ENV PIP_BREAK_SYSTEM_PACKAGES=1

# 1. Install Python 3 and build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2. Set working directory
WORKDIR /app

# 3. Install Python dependencies
# Need --break-system-packages on Debian 12+
RUN pip3 install --no-cache-dir --upgrade pip --break-system-packages && \
    pip3 install --no-cache-dir --break-system-packages spacy nltk numpy streamlit

# 4. Download necessary NLP models
RUN python3 -m spacy download en_core_web_sm && \
    python3 -m nltk.downloader wordnet averaged_perceptron_tagger punkt

# 5. Install Node.js dependencies
COPY package*.json ./
# Install ALL dependencies (including devDependencies like tailwindcss)
RUN npm install

# 6. Copy source code
COPY . .

# 7. Generate Prisma Client
RUN npx prisma generate

# 8. Build Next.js application
RUN npm run build

# 9. Expose port 3000
EXPOSE 3000

# 10. Start the application
CMD ["npm", "run", "start"]
