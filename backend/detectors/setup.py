import nltk
nltk.download('punkt')
nltk.download('wordnet')

# If using spacy
import spacy
try:
    spacy.load("en_core_web_sm")
except:
    spacy.cli.download("en_core_web_sm")
