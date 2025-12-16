'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, MessageSquare, Settings, LogOut, Trash2, Search, Shield, X, Menu } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import ChatInterface from '@/components/chat/ChatInterface'

interface Conversation {
    id: string
    title: string
    tone: string
    updatedAt: string
}

interface User {
    id: string
    name: string
    email: string
    role: string
    defaultTone: string
}

export default function DashboardContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/conversations')
            const data = await res.json()
            if (data.success) {
                setConversations(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
        }
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user
                const userRes = await fetch('/api/auth/me')
                const userData = await userRes.json()
                if (userData.success) {
                    setUser(userData.data)
                }

                // Fetch conversations
                await fetchConversations()

                // Check for conversation in URL
                const conversationId = searchParams.get('c')
                if (conversationId) {
                    setSelectedConversation(conversationId)
                }
            } catch (error) {
                console.error('Failed to fetch data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [searchParams, fetchConversations])

    const handleNewConversation = async () => {
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'New Conversation',
                    tone: user?.defaultTone || 'academic',
                }),
            })

            const data = await res.json()
            if (data.success) {
                setConversations([data.data, ...conversations])
                setSelectedConversation(data.data.id)
                router.push(`/dashboard?c=${data.data.id}`)
            }
        } catch (error) {
            console.error('Failed to create conversation:', error)
        }
    }

    const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
            setConversations(conversations.filter((c) => c.id !== id))
            if (selectedConversation === id) {
                setSelectedConversation(null)
                router.push('/dashboard')
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error)
        }
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    const filteredConversations = conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        return date.toLocaleDateString()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        )
    }

    return (
        <div className="h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden relative">
            {/* Mobile sidebar toggle */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900/90 border border-white/10 text-white shadow-lg backdrop-blur-md"
            >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar Overlay for Mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 fixed lg:relative z-50 lg:z-auto w-[280px] lg:w-80 h-full bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 ease-out shadow-2xl lg:shadow-none`}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">ContentGuard AI</h1>
                            <p className="text-xs text-gray-400">AI & Plagiarism Detector</p>
                        </div>
                    </div>

                    <button
                        onClick={handleNewConversation}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium flex items-center justify-center gap-2 transition-all duration-300"
                    >
                        <Plus className="w-5 h-5" />
                        New Analysis
                    </button>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Conversations list */}
                <div className="flex-1 overflow-y-auto px-2">
                    {filteredConversations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No conversations yet</p>
                            <p className="text-sm">Start a new analysis to begin</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredConversations.map((conversation) => (
                                <button
                                    key={conversation.id}
                                    onClick={() => {
                                        setSelectedConversation(conversation.id)
                                        router.push(`/dashboard?c=${conversation.id}`)
                                        if (window.innerWidth < 1024) setSidebarOpen(false)
                                    }}
                                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 group ${selectedConversation === conversation.id
                                        ? 'bg-purple-600/30 border border-purple-500/50'
                                        : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{conversation.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500">{formatDate(conversation.updatedAt)}</span>
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-gray-400 capitalize">
                                                    {conversation.tone}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                                            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* User section */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <span className="text-white font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>

                    {/* Admin Dashboard Link - Only visible to admins */}
                    {user?.role === 'ADMIN' && (
                        <button
                            onClick={() => router.push('/admin')}
                            className="w-full mb-3 py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 flex items-center justify-center gap-2 transition-all"
                        >
                            <Shield className="w-4 h-4" />
                            Admin Dashboard
                        </button>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push('/settings')}
                            className="flex-1 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-all"
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </button>
                        <button
                            onClick={handleLogout}
                            className="py-2 px-4 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col lg:ml-0 ml-0 min-h-0">
                {selectedConversation ? (
                    <ChatInterface
                        conversationId={selectedConversation}
                        onConversationUpdate={fetchConversations}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-10 h-10 text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Welcome to ContentGuard AI</h2>
                            <p className="text-gray-400 mb-6">
                                Analyze your content for AI-generated text and potential plagiarism.
                                Get detailed reports and rephrase suggestions.
                            </p>
                            <button
                                onClick={handleNewConversation}
                                className="py-3 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium flex items-center gap-2 mx-auto transition-all duration-300"
                            >
                                <Plus className="w-5 h-5" />
                                Start New Analysis
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
