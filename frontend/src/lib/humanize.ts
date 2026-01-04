/**
 * TypeScript port of Python humanize_text.py
 * Uses an expanded static synonym dictionary for compatibility with serverless environments
 * Uses compromise for NLP/POS tagging (matching spaCy behavior)
 */

import nlp from 'compromise'

// ========================================
// 1. Contraction Maps (exact match with Python)
// ========================================
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

// ========================================
// 2. Academic Transitions (exact match with Python)
// ========================================
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

// ========================================
// 3. Regex Patterns (exact match with Python)
// ========================================
const CITATION_REGEX = /\(\s*[A-Za-z&\-,\.\s]+(?:et al\.\s*)?,\s*\d{4}(?:,\s*(?:pp?\.\s*\d+(?:-\d+)?))?\s*\)/g
const PLACEHOLDER_REGEX = /\[\s*\[\s*REF_(\d+)\s*\]\s*\]/g

// ========================================
// 4. Expanded Synonym Dictionary (matching WordNet coverage)
// Organized by POS for accurate replacement
// ========================================
const SYNONYMS: Record<string, string[]> = {
    // === VERBS ===
    "utilize": ["use", "employ", "apply", "leverage", "harness", "exploit"],
    "demonstrate": ["show", "prove", "reveal", "display", "exhibit", "illustrate", "manifest"],
    "facilitate": ["help", "ease", "enable", "promote", "further", "assist", "aid"],
    "implement": ["execute", "carry out", "enact", "perform", "realize", "accomplish"],
    "assist": ["help", "aid", "support", "serve", "back", "abet"],
    "attempt": ["try", "strive", "endeavor", "seek", "aim", "undertake"],
    "challenge": ["test", "question", "dispute", "confront", "contest", "defy"],
    "ensure": ["make sure", "guarantee", "secure", "assure", "confirm", "verify"],
    "obtain": ["get", "acquire", "gain", "attain", "procure", "secure"],
    "provide": ["give", "supply", "furnish", "offer", "present", "deliver"],
    "require": ["need", "entail", "demand", "necessitate", "call for"],
    "select": ["choose", "pick", "opt for", "decide on", "elect"],
    "terminate": ["end", "stop", "cease", "conclude", "finish", "halt"],
    "indicate": ["show", "point out", "signify", "denote", "suggest", "imply"],
    "illustrate": ["show", "demonstrate", "exemplify", "depict", "portray"],
    "suggest": ["propose", "recommend", "advise", "imply", "hint", "indicate"],
    "establish": ["set up", "found", "institute", "create", "form", "build"],
    "identify": ["spot", "recognize", "pinpoint", "detect", "discern", "discover"],
    "examine": ["check", "inspect", "study", "analyze", "review", "scrutinize"],
    "investigate": ["explore", "examine", "study", "research", "probe", "inquire"],
    "determine": ["decide", "figure out", "conclude", "resolve", "ascertain"],
    "develop": ["grow", "evolve", "advance", "expand", "progress", "mature"],
    "enhance": ["improve", "boost", "heighten", "increase", "strengthen", "augment"],
    "maintain": ["keep", "preserve", "sustain", "continue", "uphold", "retain"],
    "occur": ["happen", "take place", "arise", "transpire", "emerge", "appear"],
    "participate": ["take part", "join", "engage", "partake", "contribute"],
    "possess": ["have", "own", "hold", "retain", "keep"],
    "prevent": ["stop", "hinder", "avert", "block", "impede", "thwart"],
    "purchase": ["buy", "acquire", "get", "obtain", "procure"],
    "receive": ["get", "obtain", "accept", "acquire", "gain"],
    "respond": ["reply", "answer", "react", "retort", "counter"],
    "achieve": ["accomplish", "attain", "reach", "realize", "complete"],
    "analyze": ["examine", "study", "investigate", "assess", "evaluate"],
    "assume": ["presume", "suppose", "believe", "think", "expect"],
    "conduct": ["perform", "carry out", "execute", "do", "undertake"],
    "consider": ["think about", "contemplate", "ponder", "reflect on", "weigh"],
    "create": ["make", "produce", "generate", "form", "develop", "design"],
    "define": ["describe", "explain", "characterize", "specify", "clarify"],
    "describe": ["explain", "depict", "portray", "illustrate", "outline"],
    "discuss": ["talk about", "debate", "consider", "examine", "explore"],
    "evaluate": ["assess", "judge", "appraise", "rate", "review"],
    "explain": ["describe", "clarify", "elucidate", "expound", "interpret"],
    "include": ["contain", "comprise", "incorporate", "encompass", "cover"],
    "increase": ["raise", "boost", "enhance", "elevate", "amplify", "grow"],
    "present": ["show", "display", "introduce", "offer", "submit"],
    "produce": ["create", "make", "generate", "manufacture", "yield"],
    "reduce": ["decrease", "lower", "diminish", "lessen", "cut"],
    "represent": ["depict", "portray", "symbolize", "stand for", "embody"],
    "support": ["back", "help", "assist", "aid", "uphold", "endorse"],
    "understand": ["comprehend", "grasp", "appreciate", "perceive", "realize"],

    // === ADJECTIVES ===
    "significant": ["important", "major", "notable", "considerable", "substantial"],
    "various": ["many", "several", "diverse", "different", "numerous"],
    "sufficient": ["enough", "adequate", "plenty", "ample"],
    "numerous": ["many", "lots of", "countless", "multiple", "several"],
    "fundamental": ["basic", "core", "essential", "key", "primary"],
    "essential": ["crucial", "vital", "key", "important", "necessary"],
    "critical": ["key", "vital", "crucial", "major", "important"],
    "beneficial": ["helpful", "good", "useful", "advantageous", "valuable"],
    "detrimental": ["harmful", "bad", "damaging", "injurious", "hurtful"],
    "effective": ["good", "useful", "successful", "efficient", "productive"],
    "efficient": ["quick", "fast", "productive", "effective", "capable"],
    "novel": ["new", "fresh", "original", "unique", "innovative"],
    "appropriate": ["fitting", "suitable", "right", "proper", "apt"],
    "incorrect": ["wrong", "false", "inaccurate", "erroneous", "mistaken"],
    "difficult": ["hard", "tough", "challenging", "demanding", "arduous"],
    "simple": ["easy", "plain", "uncomplicated", "basic", "straightforward"],
    "complex": ["complicated", "intricate", "elaborate", "sophisticated"],
    "important": ["significant", "crucial", "vital", "essential", "key"],
    "large": ["big", "huge", "vast", "enormous", "substantial"],
    "small": ["little", "tiny", "minor", "slight", "modest"],
    "good": ["excellent", "fine", "great", "positive", "favorable"],
    "bad": ["poor", "negative", "unfavorable", "adverse", "harmful"],
    "new": ["novel", "fresh", "recent", "modern", "original"],
    "old": ["ancient", "former", "previous", "outdated", "aged"],
    "high": ["elevated", "tall", "lofty", "great", "substantial"],
    "low": ["reduced", "minimal", "modest", "slight", "limited"],
    "main": ["primary", "chief", "principal", "major", "key"],
    "specific": ["particular", "precise", "exact", "definite", "explicit"],
    "general": ["broad", "overall", "common", "widespread", "universal"],
    "common": ["frequent", "usual", "typical", "widespread", "prevalent"],
    "different": ["distinct", "varied", "diverse", "dissimilar", "alternative"],
    "similar": ["alike", "comparable", "analogous", "related", "akin"],
    "strong": ["powerful", "robust", "solid", "firm", "intense"],
    "weak": ["feeble", "fragile", "frail", "poor", "inadequate"],
    "clear": ["obvious", "evident", "apparent", "plain", "distinct"],
    "certain": ["sure", "definite", "particular", "specific", "confident"],
    "possible": ["potential", "feasible", "viable", "likely", "probable"],
    "necessary": ["essential", "required", "needed", "vital", "mandatory"],
    "available": ["accessible", "obtainable", "ready", "at hand"],
    "current": ["present", "existing", "ongoing", "contemporary", "modern"],
    "previous": ["prior", "former", "earlier", "past", "preceding"],
    "following": ["subsequent", "next", "ensuing", "succeeding"],
    "additional": ["extra", "further", "more", "supplementary", "added"],
    "particular": ["specific", "certain", "special", "individual", "distinct"],
    "successful": ["effective", "productive", "fruitful", "triumphant"],
    "relevant": ["pertinent", "applicable", "related", "appropriate", "germane"],

    // === ADVERBS ===
    "additionally": ["also", "too", "besides", "moreover", "furthermore"],
    "moreover": ["also", "plus", "furthermore", "what is more", "besides"],
    "however": ["but", "yet", "still", "though", "nevertheless"],
    "therefore": ["so", "thus", "hence", "accordingly", "consequently"],
    "approximately": ["about", "around", "roughly", "nearly", "almost"],
    "currently": ["now", "at present", "right now", "presently", "today"],
    "frequently": ["often", "regularly", "commonly", "repeatedly"],
    "immediately": ["at once", "right away", "instantly", "promptly"],
    "initially": ["at first", "to start with", "originally", "first"],
    "primarily": ["mainly", "mostly", "chiefly", "principally", "largely"],
    "significantly": ["notably", "considerably", "substantially", "markedly"],
    "subsequently": ["later", "afterwards", "then", "following this", "next"],
    "particularly": ["especially", "specifically", "notably", "specifically"],
    "generally": ["usually", "typically", "commonly", "normally", "broadly"],
    "specifically": ["particularly", "especially", "precisely", "exactly"],
    "relatively": ["comparatively", "fairly", "somewhat", "rather"],
    "extremely": ["very", "highly", "exceptionally", "incredibly", "remarkably"],
    "completely": ["entirely", "fully", "totally", "wholly", "absolutely"],
    "essentially": ["basically", "fundamentally", "primarily", "mainly"],
    "obviously": ["clearly", "evidently", "apparently", "plainly"],
    "certainly": ["definitely", "surely", "undoubtedly", "absolutely"],
    "possibly": ["perhaps", "maybe", "potentially", "conceivably"],
    "likely": ["probably", "presumably", "apparently", "seemingly"],
    "actually": ["really", "in fact", "truly", "indeed", "genuinely"],
    "simply": ["just", "merely", "only", "purely", "easily"],
    "clearly": ["obviously", "evidently", "plainly", "distinctly"],
    "directly": ["straight", "immediately", "expressly", "personally"],
    "effectively": ["efficiently", "successfully", "productively"],
    "rapidly": ["quickly", "fast", "swiftly", "speedily", "hastily"],
    "slowly": ["gradually", "steadily", "leisurely", "unhurriedly"],

    // === NOUNS ===
    "concept": ["idea", "notion", "theory", "conception", "thought"],
    "conclusion": ["end", "closing", "finale", "resolution", "verdict"],
    "analysis": ["examination", "study", "review", "assessment", "evaluation"],
    "approach": ["method", "way", "technique", "strategy", "system"],
    "area": ["field", "domain", "sector", "region", "zone"],
    "aspect": ["element", "feature", "factor", "facet", "dimension"],
    "basis": ["foundation", "base", "ground", "core", "root"],
    "benefit": ["advantage", "gain", "profit", "merit", "asset"],
    "category": ["class", "group", "type", "kind", "division"],
    "component": ["part", "element", "piece", "constituent", "segment"],
    "consequence": ["result", "outcome", "effect", "aftermath", "repercussion"],
    "context": ["setting", "background", "environment", "situation", "framework"],
    "data": ["information", "facts", "figures", "statistics", "details"],
    "definition": ["meaning", "description", "explanation", "interpretation"],
    "element": ["component", "part", "factor", "feature", "aspect"],
    "environment": ["setting", "surroundings", "context", "atmosphere", "milieu"],
    "evidence": ["proof", "testimony", "indication", "sign", "demonstration"],
    "example": ["instance", "sample", "case", "illustration", "specimen"],
    "factor": ["element", "component", "aspect", "consideration", "influence"],
    "feature": ["characteristic", "attribute", "quality", "trait", "aspect"],
    "function": ["role", "purpose", "task", "job", "duty"],
    "hypothesis": ["theory", "assumption", "proposition", "conjecture", "thesis"],
    "impact": ["effect", "influence", "consequence", "result", "outcome"],
    "individual": ["person", "human", "being", "entity", "character"],
    "instance": ["example", "case", "occurrence", "situation", "event"],
    "issue": ["problem", "matter", "question", "concern", "topic"],
    "method": ["approach", "way", "technique", "procedure", "process"],
    "objective": ["goal", "aim", "target", "purpose", "end"],
    "outcome": ["result", "consequence", "effect", "end", "conclusion"],
    "period": ["time", "era", "age", "phase", "stage"],
    "perspective": ["viewpoint", "view", "standpoint", "angle", "outlook"],
    "phenomenon": ["occurrence", "event", "happening", "fact", "circumstance"],
    "principle": ["rule", "law", "standard", "guideline", "tenet"],
    "problem": ["issue", "difficulty", "challenge", "obstacle", "trouble"],
    "process": ["procedure", "method", "operation", "system", "mechanism"],
    "purpose": ["aim", "goal", "objective", "intention", "reason"],
    "reason": ["cause", "motive", "basis", "ground", "rationale"],
    "research": ["study", "investigation", "inquiry", "examination", "analysis"],
    "resource": ["asset", "material", "supply", "source", "means"],
    "response": ["reply", "answer", "reaction", "feedback", "retort"],
    "result": ["outcome", "consequence", "effect", "conclusion", "product"],
    "role": ["function", "part", "position", "job", "duty"],
    "section": ["part", "portion", "segment", "division", "chapter"],
    "significance": ["importance", "meaning", "relevance", "weight", "value"],
    "situation": ["circumstance", "condition", "state", "position", "context"],
    "source": ["origin", "root", "cause", "basis", "beginning"],
    "strategy": ["plan", "approach", "method", "tactic", "scheme"],
    "structure": ["framework", "organization", "arrangement", "system", "form"],
    "study": ["research", "investigation", "examination", "analysis", "survey"],
    "system": ["structure", "organization", "arrangement", "framework", "network"],
    "task": ["job", "duty", "assignment", "work", "chore"],
    "theory": ["hypothesis", "concept", "idea", "principle", "model"],
    "topic": ["subject", "theme", "issue", "matter", "question"],
    "type": ["kind", "sort", "category", "class", "variety"],
    "value": ["worth", "merit", "importance", "significance", "benefit"],
    "variable": ["factor", "element", "parameter", "component"],
}

// ========================================
// Helper: Citation Protection (exact port)
// ========================================
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

// ========================================
// Helper: Expand Contractions (exact port)
// ========================================
function expandContractions(sentence: string): string {
    // Build regex alternation for whole contractions
    const alt = Object.keys(WHOLE_CONTRACTIONS).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
    const wholePattern = new RegExp(`(?:(\`\`)\\s*)?(?<word>(?:${alt}))(?:\\s*(''))?`, 'gi')

    // 1) Apply whole-word contractions
    let newSentence = sentence.replace(wholePattern, (match, openTok, word, closeTok) => {
        const open = openTok || ''
        const close = closeTok || ''
        const key = word.toLowerCase()
        let repl = WHOLE_CONTRACTIONS[key] || word
        if (word && word[0] === word[0].toUpperCase()) {
            repl = repl.charAt(0).toUpperCase() + repl.slice(1)
        }
        return `${open}${repl}${close}`
    })

    // 2) Handle suffix-based contractions as fallback
    const words = newSentence.split(/\s+/)
    const outWords = words.map(t => {
        const lowerT = t.toLowerCase()
        for (const [contr, expansion] of Object.entries(SUFFIX_CONTRACTIONS)) {
            if (lowerT.endsWith(contr) && lowerT !== contr) {
                const base = t.slice(0, -contr.length)
                let newT = base + expansion
                if (t && t[0] === t[0].toUpperCase()) {
                    newT = newT.charAt(0).toUpperCase() + newT.slice(1)
                }
                return newT
            }
        }
        return t
    })

    return outWords.join(' ')
}

// ========================================
// Helper: Get Synonyms (using expanded dictionary)
// ========================================
function getSynonyms(word: string): string[] {
    const lower = word.toLowerCase()

    // Direct lookup
    if (SYNONYMS[lower]) {
        return SYNONYMS[lower]
    }

    // Try stemming for conjugated forms
    // Handle -ed endings (utilized -> utilize)
    if (lower.endsWith('ed')) {
        const try1 = lower.slice(0, -1) // utilized -> utilize
        const try2 = lower.slice(0, -2) // walked -> walk
        const try3 = lower.slice(0, -3) // studied -> study (approximation)
        if (SYNONYMS[try1]) return SYNONYMS[try1]
        if (SYNONYMS[try2]) return SYNONYMS[try2]
        if (SYNONYMS[try3]) return SYNONYMS[try3]
    }

    // Handle -ing endings
    if (lower.endsWith('ing')) {
        const try1 = lower.slice(0, -3) // walking -> walk
        const try2 = lower.slice(0, -3) + 'e' // using -> use
        if (SYNONYMS[try1]) return SYNONYMS[try1]
        if (SYNONYMS[try2]) return SYNONYMS[try2]
    }

    // Handle -s endings (plural/third person)
    if (lower.endsWith('s')) {
        const try1 = lower.slice(0, -1)
        if (SYNONYMS[try1]) return SYNONYMS[try1]
    }

    // Handle -ly adverbs
    if (lower.endsWith('ly')) {
        const try1 = lower.slice(0, -2) // quickly -> quick
        if (SYNONYMS[try1]) return SYNONYMS[try1]
    }

    return []
}

// ========================================
// Helper: Replace Synonyms (matching Python logic)
// ========================================
function replaceSynonyms(sentence: string, pSyn: number): string {
    // Skip if sentence contains citation placeholder
    if (sentence.includes('[[REF_')) {
        return sentence
    }

    const doc = nlp(sentence)

    // Process all terms
    doc.terms().forEach((term: any) => {
        const text = term.text()

        // Skip citation placeholders
        if (text.includes('[[REF_')) return

        // Check POS - target ADJ, NOUN, VERB, ADV (matching Python)
        const isAdjective = term.has('#Adjective')
        const isNoun = term.has('#Noun')
        const isVerb = term.has('#Verb')
        const isAdverb = term.has('#Adverb')

        if ((isAdjective || isNoun || isVerb || isAdverb) && Math.random() < pSyn) {
            const synonyms = getSynonyms(text)

            if (synonyms.length > 0) {
                const choice = synonyms[Math.floor(Math.random() * synonyms.length)]
                // Preserve capitalization
                if (text[0] === text[0].toUpperCase()) {
                    term.replace(choice.charAt(0).toUpperCase() + choice.slice(1))
                } else {
                    term.replace(choice)
                }
            }
        }
    })

    return doc.text()
}

// ========================================
// Helper: Add Academic Transition (exact port)
// ========================================
function addAcademicTransition(sentence: string, pTransition: number): string {
    // Check if already starts with a transition
    const startsWithTransition = ACADEMIC_TRANSITIONS.some(t =>
        sentence.trim().toLowerCase().startsWith(t.toLowerCase().replace(',', ''))
    )
    if (startsWithTransition) return sentence

    if (Math.random() < pTransition) {
        const transition = ACADEMIC_TRANSITIONS[Math.floor(Math.random() * ACADEMIC_TRANSITIONS.length)]
        return `${transition} ${sentence}`
    }
    return sentence
}

// ========================================
// Core: Minimal Humanize Line (exact port)
// ========================================
function minimalHumanizeLine(line: string, pSyn: number, pTrans: number): string {
    let processed = expandContractions(line)
    processed = replaceSynonyms(processed, pSyn)
    processed = addAcademicTransition(processed, pTrans)
    return processed
}

// ========================================
// Core: Minimal Rewriting (exact port)
// ========================================
function minimalRewriting(text: string, pSyn: number, pTrans: number): string {
    const doc = nlp(text)
    const sentences = doc.sentences().json()

    const outSentences = sentences.map((s: any) => {
        return minimalHumanizeLine(s.text, pSyn, pTrans)
    })

    return outSentences.join(' ')
}

// ========================================
// Core: Preserve Linebreaks Rewrite (exact port)
// ========================================
function preserveLinebreaksRewrite(text: string, pSyn: number, pTrans: number): string {
    const lines = text.split('\n')
    const outLines = lines.map(ln => {
        if (!ln.trim()) {
            return ''
        } else {
            return minimalRewriting(ln, pSyn, pTrans)
        }
    })
    return outLines.join('\n')
}

// ========================================
// Main Export: humanizeText
// ========================================
export async function humanizeText(
    text: string,
    synonymIntensity: number = 0.2,
    transitionFrequency: number = 0.2
): Promise<string> {
    // 1. Extract & Protect Citations
    const { text: noRefsText, map } = extractCitations(text)

    // 2. Line-by-Line / Sentence-by-Sentence Rewrite
    let processed = preserveLinebreaksRewrite(noRefsText, synonymIntensity, transitionFrequency)

    // 3. Restore Citations
    let finalText = restoreCitations(processed, map)

    // 4. Final Cleanup (spacing) - exact match with Python
    finalText = finalText.replace(/[ \t]+([.,;:!?])/g, '$1')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/``\s*(.+?)\s*''/g, '"$1"')

    return finalText
}

// Sync version for backwards compatibility
export function humanizeTextSync(
    text: string,
    synonymIntensity: number = 0.2,
    transitionFrequency: number = 0.2
): string {
    const { text: noRefsText, map } = extractCitations(text)
    let processed = preserveLinebreaksRewrite(noRefsText, synonymIntensity, transitionFrequency)
    let finalText = restoreCitations(processed, map)

    finalText = finalText.replace(/[ \t]+([.,;:!?])/g, '$1')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/``\s*(.+?)\s*''/g, '"$1"')

    return finalText
}
