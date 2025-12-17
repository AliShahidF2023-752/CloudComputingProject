#!/bin/bash
set -e

# Ensure Python3 and pip3 are available
if ! command -v python3 &> /dev/null; then
    echo "Python3 is not installed. Exiting."
    exit 1
fi

if ! command -v pip3 &> /dev/null; then
    echo "pip3 is not installed. Exiting."
    exit 1
fi

echo "Using Python: $(python3 --version)"
echo "Using pip: $(pip3 --version)"

# Install Python dependencies locally
pip3 install --user -r requirements.txt

# Add local pip bin to PATH so scripts can be used
export PATH=$HOME/.local/bin:$PATH

# Download NLTK / Spacy data if needed
python3 - <<EOF
import nltk
nltk.download('punkt', quiet=True)
nltk.download('wordnet', quiet=True)

import spacy
try:
    spacy.load("en_core_web_sm")
except:
    spacy.cli.download("en_core_web_sm")
EOF

echo "Python setup completed successfully."
