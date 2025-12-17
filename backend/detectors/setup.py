#!/bin/bash
# Update packages
apt-get update

# Install Python3 and pip
apt-get install -y python3 python3-pip

# Install Python dependencies
pip3 install -r ../backend/detectors/requirements.txt

# Download NLTK / Spacy data if needed
python3 - <<EOF
import nltk
nltk.download('punkt')
nltk.download('wordnet')

import spacy
try:
    spacy.load("en_core_web_sm")
except:
    spacy.cli.download("en_core_web_sm")
EOF
