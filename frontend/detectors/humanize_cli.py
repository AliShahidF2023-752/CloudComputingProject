
import sys
import json
import re

# Import the logic from the existing file.
# We wrap this in a try-except block in case of import errors, 
# although we expect the environment to be set up correctly.
try:
    from humanize_text import (
        extract_citations,
        restore_citations,
        preserve_linebreaks_rewrite,
        minimal_rewriting,
        count_words,
        count_sentences
    )
except ImportError:
    # If standard import fails (e.g. not in path), try adding current dir
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from humanize_text import (
        extract_citations,
        restore_citations,
        preserve_linebreaks_rewrite,
        minimal_rewriting,
        count_words,
        count_sentences
    )

def main():
    try:
        # Read JSON input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input data provided"}))
            return

        request = json.loads(input_data)
        
        text = request.get("text", "")
        p_syn = float(request.get("p_syn", 0.2))
        p_trans = float(request.get("p_trans", 0.2))
        preserve_linebreaks = request.get("preserve_linebreaks", True)

        if not text:
            print(json.dumps({"error": "Text is required"}))
            return

        # Original stats
        orig_wc = count_words(text)
        orig_sc = count_sentences(text)

        # Protect citations
        no_refs_text, placeholders = extract_citations(text)

        # Rewrite
        if preserve_linebreaks:
            rewritten = preserve_linebreaks_rewrite(no_refs_text, p_syn=p_syn, p_trans=p_trans)
        else:
            rewritten = minimal_rewriting(no_refs_text, p_syn=p_syn, p_trans=p_trans)

        # Restore citations and cleanup
        final_text = restore_citations(rewritten, placeholders)
        
        # Cleanup logic matching the prompt/original file
        final_text = re.sub(r"[ \t]+([.,;:!?])", r"\1", final_text)
        final_text = re.sub(r"(\()[ \t]+", r"\1", final_text)
        final_text = re.sub(r"[ \t]+(\))", r"\1", final_text)
        final_text = re.sub(r"[ \t]{2,}", " ", final_text)
        final_text = re.sub(r"``\s*(.+?)\s*''", r'"\1"', final_text)

        new_wc = count_words(final_text)
        new_sc = count_sentences(final_text)

        # Output JSON result
        result = {
            "humanized_text": final_text,
            "orig_word_count": orig_wc,
            "orig_sentence_count": orig_sc,
            "new_word_count": new_wc,
            "new_sentence_count": new_sc
        }
        
        print(json.dumps(result))
        sys.stdout.flush()

    except Exception as e:
        # Output error as JSON
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
