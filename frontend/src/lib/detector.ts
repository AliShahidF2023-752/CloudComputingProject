import prisma from './db'

export interface AnalysisResult {
    aiContentPercentage: number
    plagiarismPercentage: number
    originalPercentage: number
    highlights: {
        type: 'ai' | 'plagiarism' | 'mixed'
        start: number
        end: number
        text: string
        confidence: number
        sources?: string[]
    }[]
    summary: string
}

async function getDetectorSettings() {
    const settings = await prisma.systemSettings.findUnique({
        where: { id: 'default' },
        select: { detectionApiUrl: true, plagiarismApiUrl: true }
    })

    return {
        // User provided default: http://127.0.0.1:1234/detect
        detectionApiUrl: settings?.detectionApiUrl ?? 'http://127.0.0.1:1234/detect',
        plagiarismApiUrl: settings?.plagiarismApiUrl ?? 'http://127.0.0.1:5000/plagiarism'
    }
}

export async function detectAI(text: string): Promise<AnalysisResult> {
    const { detectionApiUrl, plagiarismApiUrl } = await getDetectorSettings()

    const result: AnalysisResult = {
        aiContentPercentage: 0,
        plagiarismPercentage: 0,
        originalPercentage: 100,
        highlights: [],
        summary: "Analysis complete."
    }

    // =========================
    // AI DETECTION
    // =========================
    try {
        const res = await fetch(detectionApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        })

        if (res.ok) {
            const data = await res.json()

            // New API format returns { lines: [{ text, start, end, confidence }] }
            // containing ONLY AI-detected lines.
            const aiLines = data.lines || []

            let totalAiLength = 0

            if (aiLines.length > 0) {
                aiLines.forEach((line: any) => {
                    const start = line.start
                    const end = line.end
                    const confidence = line.confidence

                    totalAiLength += (end - start)

                    result.highlights.push({
                        type: 'ai',
                        start: start,
                        end: end,
                        text: line.text,
                        confidence: confidence
                    })
                })

                // Calculate percentage based on text coverage
                if (text.length > 0) {
                    result.aiContentPercentage = Math.round((totalAiLength / text.length) * 100)
                }

                // Cap at 100
                if (result.aiContentPercentage > 100) result.aiContentPercentage = 100

                result.originalPercentage = 100 - result.aiContentPercentage
            } else {
                result.aiContentPercentage = 0
                result.originalPercentage = 100
            }
        }
    } catch (err) {
        console.warn("AI detection failed:", err)
    }

    // =========================
    // PLAGIARISM (optional)
    // =========================
    try {
        const plagRes = await fetch(plagiarismApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
            // Python server might take time to process parallel requests
            signal: AbortSignal.timeout(300000) // 5min timeout
        })

        if (plagRes.ok) {
            const data = await plagRes.json()

            result.plagiarismPercentage = Math.round(
                (data.plagiarism_score ?? data.score ?? 0) * 100
            )

            // Add parsed plagiarism highlights
            if (data.highlights && Array.isArray(data.highlights)) {
                data.highlights.forEach((h: any) => {
                    result.highlights.push({
                        type: 'plagiarism',
                        start: h.start,
                        end: h.end,
                        text: h.text,
                        confidence: h.confidence ?? 1.0,
                        sources: h.sources || []
                    })
                })
            }
        }
    } catch (err) {
        console.warn("Plagiarism check failed or timed out:", err)
    }

    // =========================
    // MERGE & RESOLVE OVERLAPS
    // =========================
    result.highlights = resolveOverlaps(result.highlights)

    // =========================
    // SUMMARY
    // =========================
    if (result.aiContentPercentage >= 50) {
        result.summary = `High likelihood of AI-generated content (${result.aiContentPercentage}%).`
    } else if (result.aiContentPercentage > 0) {
        result.summary = `Some AI content detected (${result.aiContentPercentage}%).`
    } else {
        result.summary = "Content appears human-written."
    }

    return result
}

function resolveOverlaps(highlights: AnalysisResult['highlights']): AnalysisResult['highlights'] {
    if (highlights.length === 0) return []

    // 1. Collect all unique boundary points
    const points = new Set<number>()
    highlights.forEach(h => {
        points.add(h.start)
        points.add(h.end)
    })
    const sortedPoints = Array.from(points).sort((a, b) => a - b)

    const merged: AnalysisResult['highlights'] = []

    // 2. Iterate through intervals between points
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const start = sortedPoints[i]
        const end = sortedPoints[i + 1]
        const mid = (start + end) / 2

        // Find all highlights that cover this interval
        const activeTypes = new Set<string>()
        let maxConfidence = 0
        const currentSources = new Set<string>()

        highlights.forEach(h => {
            if (h.start <= start && h.end >= end) {
                activeTypes.add(h.type)
                maxConfidence = Math.max(maxConfidence, h.confidence)
                if (h.sources) {
                    h.sources.forEach(s => currentSources.add(s))
                }
            }
        })

        if (activeTypes.size > 0) {
            let type: 'ai' | 'plagiarism' | 'mixed' = 'ai'

            if (activeTypes.has('ai') && activeTypes.has('plagiarism')) {
                type = 'mixed'
            } else if (activeTypes.has('plagiarism')) {
                type = 'plagiarism'
            } else {
                type = 'ai'
            }

            // Calculate text for this segment
            const sourceH = highlights.find(h => h.start <= start && h.end >= end)
            const segmentText = sourceH
                ? sourceH.text.slice(start - sourceH.start, end - sourceH.start)
                : ""

            // Merge with previous if same type to reduce fragmentation
            const prev = merged[merged.length - 1]
            if (prev && prev.type === type && prev.end === start) {
                prev.end = end
                prev.text += segmentText
                // Merge sources if mixed or plagiarism
                if (currentSources.size > 0) {
                    const s = new Set(prev.sources || [])
                    currentSources.forEach(src => s.add(src))
                    prev.sources = Array.from(s)
                }
            } else {
                merged.push({
                    type,
                    start,
                    end,
                    text: segmentText,
                    confidence: maxConfidence,
                    sources: currentSources.size > 0 ? Array.from(currentSources) : undefined
                })
            }
        }
    }

    // Post-processing to merge adjacent identical types
    // (The loop above didn't perfectly merge because of text slicing complexity)
    const finalMerged: AnalysisResult['highlights'] = []
    if (merged.length > 0) {
        let current = merged[0]
        for (let i = 1; i < merged.length; i++) {
            const next = merged[i]
            if (next.type === current.type && next.start === current.end) {
                // Merge
                current.end = next.end
                current.text += next.text
                // Merge sources
                if (next.sources) {
                    const s = new Set(current.sources || [])
                    next.sources.forEach(src => s.add(src))
                    current.sources = Array.from(s)
                }
            } else {
                finalMerged.push(current)
                current = next
            }
        }
        finalMerged.push(current)
    }

    return finalMerged
}
