from setuptools import setup, find_packages

setup(
    name="detectors",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "nltk",
        "spacy",
        "streamlit",
        "pandas",
        "altair",
        "scikit-learn",
        "transformers",
        "torch",
        "fastapi",
        "uvicorn",
        "pydantic"
    ],
)
