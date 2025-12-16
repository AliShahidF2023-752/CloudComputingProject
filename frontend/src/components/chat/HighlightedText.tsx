'use client'

interface Highlight {
    type: 'ai' | 'plagiarism' | 'mixed' | 'clean'
    start: number
    end: number
    text: string
    confidence?: number
}

interface HighlightedTextProps {
    content: string
    highlights: Highlight[]
}

export default function HighlightedText({ content, highlights }: HighlightedTextProps) {
    if (!highlights || highlights.length === 0) {
        return <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{content}</p>
    }

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start)

    // Build the highlighted text
    const elements: React.ReactNode[] = []
    let lastEnd = 0

    sortedHighlights.forEach((highlight, index) => {
        // Add non-highlighted text before this highlight
        if (highlight.start > lastEnd) {
            elements.push(
                <span key={`text-${index}`} className="text-gray-300">
                    {content.slice(lastEnd, highlight.start)}
                </span>
            )
        }

        // Add the highlighted text
        let highlightClass = ''
        let title = ''

        switch (highlight.type) {
            case 'ai':
                highlightClass = 'bg-red-500/30 border-b-2 border-red-500 text-red-200'
                title = 'AI Content'
                break
            case 'plagiarism':
                highlightClass = 'bg-blue-500/30 border-b-2 border-blue-500 text-blue-200'
                title = 'Plagiarism'
                break
            case 'mixed':
                highlightClass = 'bg-purple-500/30 border-b-2 border-purple-500 text-purple-200'
                title = 'AI & Plagiarism'
                break
            default:
                break
        }

        const confidenceOpacity = highlight.confidence ? Math.max(0.3, highlight.confidence) : 1

        elements.push(
            <span
                key={`highlight-${index}`}
                className={`${highlightClass} px-0.5 rounded-sm transition-all hover:opacity-80 cursor-help`}
                style={{ opacity: confidenceOpacity }}
                title={`${title} (${Math.round((highlight.confidence || 1) * 100)}% confidence)`}
            >
                {content.slice(highlight.start, highlight.end) || highlight.text}
            </span>
        )

        lastEnd = highlight.end
    })

    // Add remaining non-highlighted text
    if (lastEnd < content.length) {
        elements.push(
            <span key="text-final" className="text-gray-300">
                {content.slice(lastEnd)}
            </span>
        )
    }

    return <p className="whitespace-pre-wrap leading-relaxed">{elements}</p>
}
