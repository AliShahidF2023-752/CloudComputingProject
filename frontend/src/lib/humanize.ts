import nlp from 'compromise'

// 1. Contraction Maps
const WHOLE_CONTRACTIONS: Record<string, string> = {
    "can't": "cannot",
    "won't": "will not",
    "shan't": "shall not",
    "ain't": "is not",
    "i'm": "i am",
    "it's": "it is",
    "we're": "we are",
    "they're": "they are",
    "you're": "you are",
    "he's": "he is",
    "she's": "she is",
    "that's": "that is",
    "there's": "there is",
    "what's": "what is",
    "who's": "who is",
    "let's": "let us",
    "didn't": "did not",
    "doesn't": "does not",
    "don't": "do not",
    "couldn't": "could not",
    "shouldn't": "should not",
    "wouldn't": "would not",
    "isn't": "is not",
    "aren't": "are not",
    "weren't": "were not",
    "hasn't": "has not",
    "haven't": "have not",
    "hadn't": "had not",
}

const SUFFIX_CONTRACTIONS: Record<string, string> = {
    "n't": " not",
    "'re": " are",
    "'s": " is",
    "'ll": " will",
    "'ve": " have",
    "'d": " would",
    "'m": " am"
}

// 2. Academic Transitions
const ACADEMIC_TRANSITIONS = [
    "Moreover,",
    "Additionally,",
    "Furthermore,",
    "Hence,",
    "Therefore,",
    "Consequently,",
    "Nonetheless,",
    "Nevertheless,",
    "In contrast,",
    "On the other hand,",
    "In addition,",
    "As a result,",
]

// 3. Regex Patterns
const CITATION_REGEX = /\(\s*[A-Za-z&\-,\.\s]+(?:et al\.\s*)?,\s*\d{4}(?:,\s*(?:pp?\.\s*\d+(?:-\d+)?))?\s*\)/g
const PLACEHOLDER_REGEX = /\[\s*\[\s*REF_(\d+)\s*\]\s*\]/g

// 4. Common Synonyms
import { COMMON_SYNONYMS } from './synonyms';


// --- Helper Functions ---

function extractCitations(text: string): { text: string; map: Record<string, string> } {
    const refs = text.match(CITATION_REGEX) || []
    const placeholderMap: Record<string, string> = {}
    let replacedText = text

    refs.forEach((ref, index) => {
        const placeholder = `[[REF_${index + 1}]]`
        placeholderMap[placeholder] = ref
        replacedText = replacedText.replace(ref, placeholder)
    })

    return { text: replacedText, map: placeholderMap }
}

function restoreCitations(text: string, map: Record<string, string>): string {
    return text.replace(PLACEHOLDER_REGEX, (match, idx) => {
        const key = `[[REF_${idx}]]`
        return map[key] || match
    })
}

function expandContractions(text: string): string {
    // 1. Whole word replacements
    let newText = text.replace(/[\w']+/g, (word) => {
        const lower = word.toLowerCase()
        if (WHOLE_CONTRACTIONS[lower]) {
            const expansion = WHOLE_CONTRACTIONS[lower]
            // Maintain capitalization
            if (word[0] === word[0].toUpperCase()) {
                return expansion.charAt(0).toUpperCase() + expansion.slice(1)
            }
            return expansion
        }
        return word
    })

    // 2. Suffix replacements
    const words = newText.split(' ')
    const outWords = words.map(w => {
        const lower = w.toLowerCase()
        for (const [suffix, expansion] of Object.entries(SUFFIX_CONTRACTIONS)) {
            if (lower.endsWith(suffix) && lower !== suffix) {
                const base = w.slice(0, -suffix.length)
                return base + expansion
            }
        }
        return w
    })

    return outWords.join(' ')
}

function replaceSynonyms(sentence: string, intensity: number): string {
    const doc = nlp(sentence)

    // Iterate through terms and replace if they match our dictionary and POS conditions
    // Using compromise to identify basic parts of speech

    doc.terms().forEach((term: any) => {
        const text = term.text()

        // Skip placeholders
        if (text.includes('[[REF_')) return

        // Get POS tags from compromise
        // Check if POS matches ADJ, NOUN, VERB, ADV logic
        // Compromise tags: Adjective, Noun, Verb, Adverb
        const isTargetPOS = term.has('#Adjective') || term.has('#Noun') || term.has('#Verb') || term.has('#Adverb')

        if (isTargetPOS) {
            const lower = text.toLowerCase()

            // Check if we have synonyms for this word
            if (COMMON_SYNONYMS[lower]) {
                if (Math.random() < intensity) {
                    const options = COMMON_SYNONYMS[lower]
                    const choice = options[Math.floor(Math.random() * options.length)]

                    // Maintain basic capitalization
                    if (text[0] === text[0].toUpperCase()) {
                        term.replace(choice.charAt(0).toUpperCase() + choice.slice(1))
                    } else {
                        term.replace(choice)
                    }
                }
            }
        }
    })

    return doc.text()
}

function addAcademicTransition(sentence: string, frequency: number): string {
    // Check if sentence already starts with any academic transition
    const startsWithTransition = ACADEMIC_TRANSITIONS.some(t => sentence.trim().startsWith(t.replace(',', '')));
    if (startsWithTransition) return sentence;

    if (Math.random() < frequency) {
        const transition = ACADEMIC_TRANSITIONS[Math.floor(Math.random() * ACADEMIC_TRANSITIONS.length)]
        // Double check specific transition presence just in case
        if (!sentence.includes(transition)) {
            return `${transition} ${sentence}`
        }
    }
    return sentence
}

// Port of "minimal_humanize_line"
function minimalHumanizeLine(line: string, pSyn: number, pTrans: number): string {
    let processed = expandContractions(line)
    processed = replaceSynonyms(processed, pSyn)
    processed = addAcademicTransition(processed, pTrans)
    return processed
}

// Port of "minimal_rewriting"
function minimalRewriting(text: string, pSyn: number, pTrans: number): string {
    // Process sentence by sentence
    const doc = nlp(text)
    const sentences = doc.sentences().json()

    const outSentences = sentences.map((s: any) => {
        return minimalHumanizeLine(s.text, pSyn, pTrans)
    })

    return outSentences.join(' ')
}

// Port of "preserve_linebreaks_rewrite"
function preserveLinebreaksRewrite(text: string, pSyn: number, pTrans: number): string {
    const lines = text.split('\n')
    const outLines = lines.map(ln => {
        if (!ln.trim()) {
            return ""
        } else {
            return minimalRewriting(ln, pSyn, pTrans)
        }
    })
    return outLines.join('\n')
}

// Main Export
export function humanizeText(
    text: string,
    synonymIntensity: number = 0.2,
    transitionFrequency: number = 0.2
): string {
    // 1. Extract & Protect Citations (Global Step, as per script logic flow)
    const { text: noRefsText, map } = extractCitations(text)

    // 2. Line-by-Line / Sentence-by-Sentence Rewrite
    let processed = preserveLinebreaksRewrite(noRefsText, synonymIntensity, transitionFrequency)

    // 3. Restore Citations
    let finalText = restoreCitations(processed, map)

    // 4. Final Cleanup (spacing)
    // The script script normalized spaces around punctuation after everything
    finalText = finalText.replace(/\s+([.,;:!?])/g, '$1')
        .replace(/(\()\s+/g, '$1')
        .replace(/\s+(\))/g, '$1')
        .replace(/\s{2,}/g, ' ')
        // Normalize paired quotes logic roughly
        .replace(/``\s*(.+?)\s*''/g, '"$1"')

    return finalText
}
