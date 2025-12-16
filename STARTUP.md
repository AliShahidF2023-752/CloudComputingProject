# Project Startup Guide

You need 3 separate terminals to run the full stack.

### Terminal 1: Python AI Server
Controls the AI detection models.
```bash
# From project root
cd backend/detectors
pip install -r requirements.txt  # (Only needed once)
/opt/homebrew/bin/python3 server_granular.py
```
*Wait until you see "Server running on port 1234"*

### Terminal 2: Frontend (Next.js)
The main web application and API layer.
```bash
# From project root
cd frontend
npm install              # (Only needed once)
npx prisma db push       # (Sync database schema)
npm run dev
```
*Access at http://localhost:3000*

### Terminal 3: WhatsApp Bot
The bot service that connects to WhatsApp.
```bash
# From project root
cd backend/whatsapp-bot
npm install              # (Only needed once)
npm start
```
*A QR code will appear in this terminal. Scan it with your phone (WhatsApp -> Settings -> Linked Devices).*
