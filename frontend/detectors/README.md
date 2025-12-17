# Frontend Detectors

This directory contains the AI detection and text humanization modules moved from the backend.

## Contents

- `humanize_cli.py`: CLI interface for humanizing text. Used by Next.js API routes.
- `humanize_text.py`: Core logic for text humanization.
- `ai_detection.py`: Streamlit-based AI detection tool.

## Known Issues

### ai_detection.py dependencies
The `ai_detection.py` script imports `utils.pdf_utils` and `utils.ai_detection_utils`.
These `utils` modules were not found in the `backend` or `model` directories during the migration.
As a result, `ai_detection.py` may not function correctly without these dependencies being restored or implemented.

### Setup
The `setup.py` file is a Bash script intended for Linux environments. It may not work on Windows.
To install dependencies manually:
```bash
pip install -r requirements.txt
```
