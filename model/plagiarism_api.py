"""
Plagiarism Checker API - PARALLEL PROCESSING

A Flask-based plagiarism detection service that uses Selenium with:
- PARALLEL sentence checking (multiple Chrome instances at once)
- Snippet-first approach
- Optimized for speed on powerful hardware
"""

from flask import Flask, request, jsonify
import nltk
import re
import time
import traceback
from urllib.parse import urlparse
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Download nltk tokenizer (only runs once)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download("punkt", quiet=True)

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download("punkt_tab", quiet=True)

app = Flask(__name__)

# ---------------------------
# Configuration (Optimized for Parallel Processing)
# ---------------------------
MAX_SEARCH_RESULTS = 3
MIN_SENTENCE_LENGTH = 15
PAGE_LOAD_TIMEOUT = 6  # Reduced further
SEARCH_WAIT = 1.5  # Reduced
PAGE_WAIT = 0.5  # Reduced
MAX_PAGES_TO_VISIT = 2
MAX_WORKERS = 8  # Number of parallel Chrome instances (adjust based on RAM)

# Thread-local storage for drivers
thread_local = threading.local()

# ---------------------------
# Helper Functions
# ---------------------------
def normalize_for_search(text: str) -> str:
    """Normalize text for comparison - lowercase and remove extra whitespace"""
    text = text.lower().strip()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s]', '', text)
    return text

def text_exists_in_page(driver, sentence: str) -> bool:
    """Check if sentence exists in the current page"""
    try:
        page_text = driver.execute_script("""
            return document.body ? (document.body.innerText || document.body.textContent || '') : '';
        """)
        
        page_text_normalized = normalize_for_search(page_text)
        sentence_normalized = normalize_for_search(sentence)
        
        # Exact match
        if sentence_normalized in page_text_normalized:
            return True
        
        # Quick partial match check
        sentence_words = sentence_normalized.split()
        if len(sentence_words) >= 5:
            for window_size in range(len(sentence_words), max(3, int(len(sentence_words) * 0.7)), -1):
                substring = ' '.join(sentence_words[:window_size])
                if substring in page_text_normalized:
                    match_ratio = window_size / len(sentence_words)
                    if match_ratio >= 0.7:
                        return True
                    break
        
        return False
        
    except Exception as e:
        return False

def get_thread_driver():
    """Get or create a driver for the current thread"""
    if not hasattr(thread_local, 'driver') or thread_local.driver is None:
        chrome_options = Options()
        
        # Headless mode
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--headless")
        
        # Performance optimizations
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--disable-software-rasterizer")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-logging")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--blink-settings=imagesEnabled=false")  # Disable images
        
        # Speed optimizations
        prefs = {
            "profile.managed_default_content_settings.images": 2,
            "profile.default_content_setting_values.notifications": 2,
            "profile.managed_default_content_settings.stylesheets": 2,
            "profile.managed_default_content_settings.cookies": 2,
            "profile.managed_default_content_settings.javascript": 1,
            "profile.managed_default_content_settings.plugins": 2,
            "profile.managed_default_content_settings.popups": 2,
            "profile.managed_default_content_settings.geolocation": 2,
            "profile.managed_default_content_settings.media_stream": 2,
        }
        chrome_options.add_experimental_option("prefs", prefs)
        
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        service = Service(ChromeDriverManager().install())
        service.log_path = "NUL" if os.name == 'nt' else "/dev/null"
        
        thread_local.driver = webdriver.Chrome(service=service, options=chrome_options)
        thread_local.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        thread_local.driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
        
        logger.info(f"✓ Created driver for thread {threading.current_thread().name}")
    
    return thread_local.driver

def is_valid_url(url: str) -> bool:
    """Check if URL is valid and not a search engine internal link"""
    if not url or not url.startswith("http"):
        return False
    
    skip_domains = [
        "duckduckgo.com", "google.com", "bing.com", "yahoo.com", "duck.co",
        "boredpanda.com", "pinterest.com", "instagram.com", "twitter.com",
        "facebook.com", "tiktok.com"
    ]
    
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        for skip in skip_domains:
            if skip in domain:
                return False
        return True
    except:
        return False

def search_sentence_parallel(sentence_data: tuple) -> dict:
    """
    Search for a single sentence - designed to run in parallel.
    Returns a result dict with sentence info and found URLs.
    """
    sentence_idx, sentence, start, end = sentence_data
    found_urls = []
    
    try:
        driver = get_thread_driver()
        
        # Search DuckDuckGo
        search_query = sentence.replace('"', '')
        search_url = f"https://duckduckgo.com/?q={search_query}&t=h_&ia=web"
        
        logger.info(f"[{sentence_idx}] 🔍 Searching: {sentence[:50]}...")
        driver.get(search_url)
        time.sleep(SEARCH_WAIT)
        
        # Extract URLs and snippets
        urls_and_snippets = driver.execute_script("""
            var results = [];
            
            // Try new DuckDuckGo layout
            var articles = document.querySelectorAll('article[data-testid="result"]');
            articles.forEach(function(article) {
                var link = article.querySelector('a[data-testid="result-title-a"]');
                var snippet = article.querySelector('[data-result="snippet"]');
                if (!snippet) snippet = article.querySelector('span');
                if (link && link.href) {
                    results.push({
                        url: link.href,
                        snippet: snippet ? snippet.innerText : ''
                    });
                }
            });
            
            // Try old DuckDuckGo layout
            if (results.length === 0) {
                var oldResults = document.querySelectorAll('.result');
                oldResults.forEach(function(result) {
                    var link = result.querySelector('a.result__a');
                    var snippet = result.querySelector('.result__snippet');
                    if (link && link.href) {
                        results.push({
                            url: link.href,
                            snippet: snippet ? snippet.innerText : ''
                        });
                    }
                });
            }
            
            return results;
        """)
        
        # Filter to valid URLs
        valid_results = []
        for result in urls_and_snippets:
            url = result.get('url', '')
            snippet = result.get('snippet', '')
            if is_valid_url(url) and url not in [r['url'] for r in valid_results]:
                valid_results.append({'url': url, 'snippet': snippet})
                if len(valid_results) >= MAX_SEARCH_RESULTS:
                    break
        
        if not valid_results:
            logger.info(f"[{sentence_idx}] ⚠️  No valid URLs")
            return {
                'index': sentence_idx,
                'sentence': sentence,
                'start': start,
                'end': end,
                'found_urls': []
            }
        
        # Check snippets first (FAST)
        sentence_normalized = normalize_for_search(sentence)
        for result in valid_results:
            snippet = result.get('snippet', '')
            if snippet and sentence_normalized in normalize_for_search(snippet):
                logger.info(f"[{sentence_idx}] ✓ Found in snippet!")
                found_urls.append(result['url'])
        
        # If found in snippets, return immediately
        if found_urls:
            logger.info(f"[{sentence_idx}] ❌ PLAGIARIZED (snippet match)")
            return {
                'index': sentence_idx,
                'sentence': sentence,
                'start': start,
                'end': end,
                'found_urls': found_urls
            }
        
        # Visit pages if needed
        for i, result in enumerate(valid_results[:MAX_PAGES_TO_VISIT]):
            url = result['url']
            try:
                driver.get(url)
                time.sleep(PAGE_WAIT)
                
                if text_exists_in_page(driver, sentence):
                    found_urls.append(url)
                    break  # Stop after first match
                    
            except Exception as e:
                continue
        
        if found_urls:
            logger.info(f"[{sentence_idx}] ❌ PLAGIARIZED (page match)")
        else:
            logger.info(f"[{sentence_idx}] ✅ ORIGINAL")
        
        return {
            'index': sentence_idx,
            'sentence': sentence,
            'start': start,
            'end': end,
            'found_urls': found_urls
        }
        
    except Exception as e:
        logger.error(f"[{sentence_idx}] Error: {e}")
        return {
            'index': sentence_idx,
            'sentence': sentence,
            'start': start,
            'end': end,
            'found_urls': []
        }

def split_into_sentences(text: str) -> list:
    """Split text into sentences"""
    try:
        # Add space after period if missing
        text = re.sub(r'\.(?=[A-Z])', '. ', text)
        text = re.sub(r'\!(?=[A-Z])', '! ', text)
        text = re.sub(r'\?(?=[A-Z])', '? ', text)
        
        # Use NLTK to tokenize
        sentences = nltk.sent_tokenize(text)
        
        # Filter out very short sentences
        cleaned_sentences = []
        for s in sentences:
            s = s.strip()
            if len(s) >= MIN_SENTENCE_LENGTH:
                cleaned_sentences.append(s)
        
        logger.info(f"📝 Split into {len(cleaned_sentences)} sentences")
        return cleaned_sentences
        
    except Exception as e:
        logger.error(f"Sentence tokenization failed: {e}")
        sentences = re.split(r'[.!?]+\s*', text)
        cleaned = [s.strip() for s in sentences if len(s.strip()) >= MIN_SENTENCE_LENGTH]
        return cleaned

def cleanup_drivers():
    """Clean up all thread drivers"""
    if hasattr(thread_local, 'driver') and thread_local.driver:
        try:
            thread_local.driver.quit()
            thread_local.driver = None
        except:
            pass

# ---------------------------
# API Endpoints
# ---------------------------
@app.route('/plagiarism', methods=['POST'])
def check_plagiarism():
    """
    Check text for plagiarism using PARALLEL processing.
    All sentences are checked simultaneously for maximum speed.
    """
    start_time = time.time()
    
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request body"}), 400
        
        text = data['text']
        
        if not text or not text.strip():
            return jsonify({"error": "Text cannot be empty"}), 400
        
        sentences = split_into_sentences(text)
        
        if not sentences:
            return jsonify({
                "plagiarism_score": 0.0,
                "highlights": [],
                "processing_time": time.time() - start_time
            })
        
        logger.info("=" * 60)
        logger.info(f"🚀 PARALLEL CHECK STARTED ({len(sentences)} sentences)")
        logger.info(f"⚡ Using {MAX_WORKERS} parallel workers")
        logger.info("=" * 60)
        
        # Prepare sentence data with positions
        sentence_data = []
        cursor = 0
        for i, sentence in enumerate(sentences):
            start = text.find(sentence, cursor)
            if start == -1:
                start = text.find(sentence)
            if start == -1:
                continue
            end = start + len(sentence)
            cursor = end
            sentence_data.append((i + 1, sentence, start, end))
        
        # Process all sentences in parallel using ThreadPoolExecutor
        results = []
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Submit all tasks
            future_to_sentence = {
                executor.submit(search_sentence_parallel, data): data 
                for data in sentence_data
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_sentence):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logger.error(f"Task failed: {e}")
        
        # Sort results by index to maintain order
        results.sort(key=lambda x: x['index'])
        
        # Build highlights from results
        highlights = []
        for result in results:
            if result['found_urls']:
                highlights.append({
                    "start": result['start'],
                    "end": result['end'],
                    "text": result['sentence'],
                    "confidence": 1.0,
                    "sources": result['found_urls']
                })
        
        # Calculate plagiarism score
        plagiarism_score = len(highlights) / len(sentences) if sentences else 0.0
        total_time = time.time() - start_time
        
        logger.info("\n" + "=" * 60)
        logger.info(f"✅ COMPLETE - {plagiarism_score:.0%} plagiarized ({len(highlights)}/{len(sentences)})")
        logger.info(f"⚡ Total time: {total_time:.1f}s")
        logger.info(f"🚀 Speed boost: {(len(sentences) * 10) / max(total_time, 1):.1f}x faster than sequential")
        logger.info("=" * 60 + "\n")
        
        return jsonify({
            "plagiarism_score": plagiarism_score,
            "highlights": highlights,
            "processing_time": total_time,
            "sentences_checked": len(sentences),
            "parallel_workers": MAX_WORKERS
        })
        
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        # Don't cleanup drivers here - they'll be reused for next request
        pass

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "plagiarism-checker"})

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API info"""
    return jsonify({
        "name": "Plagiarism Checker API",
        "version": "4.0.0 (PARALLEL)",
        "description": "Ultra-fast parallel Selenium-based plagiarism detection",
        "optimizations": [
            f"{MAX_WORKERS} parallel Chrome instances",
            "All sentences checked simultaneously",
            "Thread-local driver pooling",
            "Snippet-first checking",
            "Disabled images/CSS",
            "Aggressive timeouts"
        ],
        "hardware": "Optimized for 7800X3D + 32GB RAM",
        "endpoints": {
            "POST /plagiarism": "Check text for plagiarism",
            "GET /health": "Health check"
        }
    })

# ---------------------------
# Run server
# ---------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("PLAGIARISM CHECKER API v4.0 (PARALLEL)")
    print(f"⚡ {MAX_WORKERS} Parallel Workers")
    print("Server: http://0.0.0.0:5000")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)