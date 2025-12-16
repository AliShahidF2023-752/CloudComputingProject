
import prisma from './db'

interface LLMSettings {
    llmApiUrl: string
    llmModel: string
    maxTokens: number
    temperature: number
    rephraseTemperature: number
    topP: number
}

async function getSettings(): Promise<LLMSettings> {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' },
        })
        return {
            llmApiUrl: settings?.llmApiUrl || process.env.LLM_API_URL || 'http://127.0.0.1:5000/v1',
            llmModel: settings?.llmModel || process.env.LLM_MODEL || 'qwen2.5-14b-instruct',
            maxTokens: settings?.maxTokens || 4096,
            temperature: settings?.temperature || 0.3,
            rephraseTemperature: settings?.rephraseTemperature || 0.8,
            topP: settings?.topP || 0.9,
        }
    } catch {
        return {
            llmApiUrl: process.env.LLM_API_URL || 'http://127.0.0.1:5000/v1',
            llmModel: process.env.LLM_MODEL || 'qwen2.5-14b-instruct',
            maxTokens: 4096,
            temperature: 0.3,
            rephraseTemperature: 0.8,
            topP: 0.9,
        }
    }
}

export interface HighlightSegment {
    type: 'ai' | 'plagiarism' | 'clean' | 'mixed'
    start: number
    end: number
    text: string
    confidence?: number
}

export interface AnalysisResult {
    aiContentPercentage: number
    plagiarismPercentage: number
    originalPercentage: number
    highlights: HighlightSegment[]
    summary: string
}

export interface LLMResponse {
    choices: {
        message: {
            content: string
        }
    }[]
}

// Low-level LLM call function kept for potential future use or other features
export async function callLLM(messages: { role: string; content: string }[]): Promise<string> {
    const settings = await getSettings()
    return callLLMWithTemp(messages, settings.temperature)
}

async function callLLMWithTemp(
    messages: { role: string; content: string }[],
    temperature: number
): Promise<string> {
    const settings = await getSettings()

    const response = await fetch(`${settings.llmApiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: settings.llmModel,
            messages,
            temperature: temperature,
            max_tokens: settings.maxTokens,
            top_p: settings.topP,
        }),
    })

    if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${response.statusText}`)
    }

    const data: LLMResponse = await response.json()
    return data.choices[0]?.message?.content || ''
}

// Deprecated: analyzeText and rephraseText have been replaced by local logic in detector.ts and humanize.ts
