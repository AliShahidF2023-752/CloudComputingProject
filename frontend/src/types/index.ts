export interface User {
    id: string
    email: string
    name: string
    role: 'USER' | 'ADMIN'
    educationLevel: string | null
    userType: string | null
    defaultTone: string
    onboarded: boolean
    createdAt: Date
    updatedAt: Date
}

export interface Conversation {
    id: string
    userId: string
    title: string
    tone: string
    createdAt: Date
    updatedAt: Date
    messages?: Message[]
}

export interface Message {
    id: string
    conversationId: string
    type: 'USER_INPUT' | 'ANALYSIS_RESULT' | 'REPHRASED'
    content: string
    analysisData: AnalysisData | null
    createdAt: Date
}

export interface AnalysisData {
    aiContentPercentage: number
    plagiarismPercentage: number
    originalPercentage: number
    highlights: HighlightSegment[]
    summary: string
}

export interface HighlightSegment {
    type: 'ai' | 'plagiarism' | 'clean'
    start: number
    end: number
    text: string
    confidence?: number
}

export interface UserPreferences {
    educationLevel: 'high_school' | 'undergraduate' | 'graduate' | 'professional' | null
    userType: 'student' | 'researcher' | 'writer' | 'other' | null
    defaultTone: 'academic' | 'formal' | 'informal'
}

export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
}

export interface ConversationWithMessages extends Conversation {
    messages: Message[]
}
