'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, RefreshCw, Copy, Check, Sparkles, Settings2, X } from 'lucide-react'
import AnalysisReport from './AnalysisReport'
import HighlightedText from './HighlightedText'

interface Message {
    id: string
    type: 'USER_INPUT' | 'ANALYSIS_RESULT' | 'REPHRASED'
    content: string
    analysisData: string | null
    createdAt: string
}

interface AnalysisData {
    aiContentPercentage: number
    plagiarismPercentage: number
    originalPercentage: number
    highlights: Array<{
        type: 'ai' | 'plagiarism'
        start: number
        end: number
        text: string
        confidence?: number
    }>
    summary: string
}

interface Conversation {
    id: string
    title: string
    tone: string
    messages: Message[]
    synonymIntensity: number
    transitionFrequency: number
}

interface ChatInterfaceProps {
    conversationId: string
    onConversationUpdate: () => void
}

export default function ChatInterface({ conversationId, onConversationUpdate }: ChatInterfaceProps) {
    const [conversation, setConversation] = useState<Conversation | null>(null)
    const [inputText, setInputText] = useState('')
    const [tone, setTone] = useState('academic')
    const [loading, setLoading] = useState(false)

    // Humanization Settings
    const [showSettings, setShowSettings] = useState(false)
    const [synonymIntensity, setSynonymIntensity] = useState(0.2)
    const [transitionFrequency, setTransitionFrequency] = useState(0.2)
    const [savingSettings, setSavingSettings] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [rephrasing, setRephrasing] = useState(false)
    const [copied, setCopied] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchConversation = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/conversations/${conversationId}`)
                const data = await res.json()
                if (data.success) {
                    setConversation(data.data)
                    setTone(data.data.tone)
                    setSynonymIntensity(data.data.synonymIntensity || 0.2)
                    setTransitionFrequency(data.data.transitionFrequency || 0.2)
                }
            } catch (error) {
                console.error('Failed to fetch conversation:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchConversation()
    }, [conversationId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversation?.messages])

    const handleAnalyze = async () => {
        if (!inputText.trim() || analyzing) return

        setAnalyzing(true)
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    content: inputText,
                    tone,
                }),
            })

            const data = await res.json()
            if (data.success) {
                setConversation((prev) => {
                    if (!prev) return prev
                    return {
                        ...prev,
                        messages: [
                            ...prev.messages,
                            data.data.userMessage,
                            {
                                ...data.data.analysisMessage,
                                analysisData: JSON.stringify(data.data.analysisMessage.analysisData),
                            },
                        ],
                    }
                })
                setInputText('')
                onConversationUpdate()
            }
        } catch (error) {
            console.error('Analysis failed:', error)
        } finally {
            setAnalyzing(false)
        }
    }

    const handleRephrase = async (content: string) => {
        if (rephrasing) return

        setRephrasing(true)
        // Close settings if open
        setShowSettings(false)
        try {
            const res = await fetch('/api/rephrase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    content,
                    tone,
                    // The API now reads settings from DB, so we should save them first if changed
                    // But for simplicity, we assume they rely on what's in DB.
                    // Ideally we should auto-save settings when changed.
                }),
            })

            const data = await res.json()
            if (data.success) {
                setConversation((prev) => {
                    if (!prev) return prev
                    return {
                        ...prev,
                        messages: [
                            ...prev.messages,
                            {
                                ...data.data.message,
                                analysisData: JSON.stringify(data.data.analysis),
                            },
                        ],
                    }
                })
            }
        } catch (error) {
            console.error('Rephrasing failed:', error)
        } finally {
            setRephrasing(false)
        }
    }

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const parseAnalysisData = (data: string | null): AnalysisData | null => {
        if (!data) return null
        try {
            return JSON.parse(data)
        } catch {
            return null
        }
    }

    const saveSettings = async (syn: number, trans: number) => {
        setSavingSettings(true)
        try {
            await fetch(`/api/conversations/${conversationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    synonymIntensity: syn,
                    transitionFrequency: trans
                })
            })
            // Update local conversation state too
            if (conversation) {
                setConversation({
                    ...conversation,
                    synonymIntensity: syn,
                    transitionFrequency: trans
                })
            }
        } catch (err) {
            console.error('Failed to save settings', err)
        } finally {
            setSavingSettings(false)
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 lg:p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-sm pl-16 lg:pl-4">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <h2 className="text-base lg:text-lg font-semibold text-white truncate max-w-[150px] lg:max-w-none">{conversation?.title}</h2>
                    <div className="flex items-center gap-2">
                        {/* Tone Selector - Compact on Mobile */}
                        <div className="flex items-center bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                            <select
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="px-2 py-1.5 bg-transparent text-white text-xs lg:text-sm focus:outline-none focus:bg-white/5 appearance-none min-w-[80px] text-center"
                            >
                                <option value="academic">Academic</option>
                                <option value="formal">Formal</option>
                                <option value="informal">Informal</option>
                            </select>
                        </div>

                        {/* Settings Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`p-1.5 lg:p-2 rounded-lg transition-all ${showSettings ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <Settings2 className="w-4 h-4 lg:w-5 lg:h-5" />
                            </button>

                            {/* Settings Popover - Mobile Optimized Position */}
                            {showSettings && (
                                <>
                                    <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setShowSettings(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-72 lg:w-80 bg-slate-900 border border-white/10 rounded-xl shadow-xl p-4 z-50 backdrop-blur-xl">
                                        {/* ... existing settings content ... */}
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-white">Rephrasing Settings</h3>
                                            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {/* ... rest of settings ... */}
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs text-gray-400">Synonym Intensity</label>
                                                    <span className="text-xs text-purple-400 font-mono">{synonymIntensity}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.05"
                                                    value={synonymIntensity}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value)
                                                        setSynonymIntensity(val)
                                                    }}
                                                    onMouseUp={() => saveSettings(synonymIntensity, transitionFrequency)}
                                                    onTouchEnd={() => saveSettings(synonymIntensity, transitionFrequency)}
                                                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs text-gray-400">Transition Frequency</label>
                                                    <span className="text-xs text-purple-400 font-mono">{transitionFrequency}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.05"
                                                    value={transitionFrequency}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value)
                                                        setTransitionFrequency(val)
                                                    }}
                                                    onMouseUp={() => saveSettings(synonymIntensity, transitionFrequency)}
                                                    onTouchEnd={() => saveSettings(synonymIntensity, transitionFrequency)}
                                                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-4 scroll-smooth">
                <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6 pb-4">
                    {/* ... zero state ... */}
                    {conversation?.messages.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">Ready to analyze your content</p>
                            <p className="text-sm px-4">Paste or type your text below to check for AI content and plagiarism</p>
                        </div>
                    )}

                    {conversation?.messages.map((message, index) => {
                        const analysisData = parseAnalysisData(message.analysisData)

                        if (message.type === 'USER_INPUT') {
                            return (
                                <div key={message.id} className="bg-white/5 rounded-2xl p-4 lg:p-6 border border-white/10 max-w-[95%] lg:max-w-none ml-auto">
                                    <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                        <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-[10px] lg:text-xs font-medium">
                                            Your Text
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm lg:text-base whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                            )
                        }

                        if (message.type === 'ANALYSIS_RESULT' || message.type === 'REPHRASED') {
                            return (
                                <div key={message.id} className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-4 lg:p-6 border border-purple-500/20 w-full">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] lg:text-xs font-medium ${message.type === 'REPHRASED'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-purple-500/20 text-purple-400'
                                            }`}>
                                            {message.type === 'REPHRASED' ? 'Rephrased Text' : 'Analysis Result'}
                                        </span>
                                        {message.type === 'REPHRASED' && (
                                            <span className="text-[10px] lg:text-xs text-gray-500">Optimized</span>
                                        )}
                                    </div>

                                    {/* Analysis Report */}
                                    {analysisData && (
                                        <AnalysisReport
                                            aiPercentage={analysisData.aiContentPercentage}
                                            plagiarismPercentage={analysisData.plagiarismPercentage}
                                            originalPercentage={analysisData.originalPercentage}
                                            summary={analysisData.summary}
                                        />
                                    )}

                                    {/* Highlighted Text */}
                                    <div className="mt-4">
                                        <h4 className="text-xs lg:text-sm font-medium text-gray-400 mb-2">Content Analysis:</h4>
                                        <div className="bg-slate-900/50 rounded-xl p-3 lg:p-4 border border-white/5 overflow-x-auto">
                                            <HighlightedText
                                                content={message.content}
                                                highlights={analysisData?.highlights || []}
                                            />
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex flex-wrap items-center gap-2 lg:gap-3 mt-4">
                                        <button
                                            onClick={() => handleCopy(message.content)}
                                            className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center gap-2 transition-all text-xs lg:text-sm"
                                        >
                                            {copied ? <Check className="w-3 h-3 lg:w-4 lg:h-4" /> : <Copy className="w-3 h-3 lg:w-4 lg:h-4" />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>

                                        {analysisData && (analysisData.aiContentPercentage > 10 || analysisData.plagiarismPercentage > 10) && (
                                            <button
                                                onClick={() => handleRephrase(message.content)}
                                                disabled={rephrasing}
                                                className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center gap-2 transition-all text-xs lg:text-sm disabled:opacity-50"
                                            >
                                                {rephrasing ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="w-3 h-3 lg:w-4 lg:h-4" />
                                                        Rephrase
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        }

                        return null
                    })}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 p-3 lg:p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur-sm safe-area-bottom">
                <div className="max-w-4xl mx-auto">
                    <div className="relative">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Enter text..."
                            rows={1}
                            style={{ minHeight: '44px' }}
                            className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm lg:text-base max-h-32"
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto'; // Reset height
                                target.style.height = `${Math.min(target.scrollHeight, 128)}px`; // Grow up to 128px
                            }}
                        />
                        <button
                            onClick={handleAnalyze}
                            disabled={!inputText.trim() || analyzing}
                            className="absolute right-2 bottom-1.5 p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {analyzing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    <p className=" hidden lg:block text-xs text-gray-500 mt-2 text-center">
                        Press Enter to analyze
                    </p>
                </div>
            </div>
        </div>
    )
}
