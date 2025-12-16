#!/bin/bash

# Start AI Service (FastAPI) in background
# bind to 0.0.0.0:1234
echo "Starting AI Service..."
uvicorn run:app --host 0.0.0.0 --port 1234 &

# Start Plagiarism Service (Flask) in background
# bind to 0.0.0.0:5000
echo "Starting Plagiarism Service..."
python plagiarism_api.py &

# Wait for any process to exit
# If one exits, the container will exit (good for restart policies)
wait -n

# Exit with status of process that exited first
exit $?
