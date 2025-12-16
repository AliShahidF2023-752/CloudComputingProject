'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Users,
    MessageSquare,
    FileText,
    TrendingUp,
    ArrowLeft,
    Shield,
    UserCircle,
    BarChart3,
    Settings,
    CheckCircle,
    XCircle,
    Loader2,
    Save,
    RefreshCw,
    Type,
    Smartphone,
} from 'lucide-react'
import WhatsAppDashboard from '../../components/admin/WhatsAppDashboard'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts'

interface Analytics {
    overview: {
        totalUsers: number
        todayUsers: number
        weekUsers: number
        totalConversations: number
        todayConversations: number
        totalMessages: number
        todayMessages: number
        totalCharacters: number
        todayCharacters: number
        avgCharPerMessage: number
        maxCharPerMessage: number
    }
    usersByType: Array<{ type: string; count: number }>
    usersByEducation: Array<{ level: string; count: number }>
    dailyStats: Array<{
        date: string
        users: number
        conversations: number
        messages: number
        characters: number
    }>
    topUsers: Array<{
        id: string
        name: string
        email: string
        conversations: number
    }>
}

interface UserData {
    id: string
    email: string
    name: string
    role: string
    userType: string | null
    educationLevel: string | null
    createdAt: string
    _count: { conversations: number }
}

interface SystemSettings {
    llmApiUrl: string
    llmModel: string
    maxTokens: number
    temperature: number
    rephraseTemperature: number
    topP: number
    detectionApiUrl: string
    plagiarismApiUrl: string
}

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b']

export default function AdminDashboard() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings' | 'whatsapp'>('overview')
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [users, setUsers] = useState<UserData[]>([])
    const [settings, setSettings] = useState<SystemSettings>({
        llmApiUrl: 'http://127.0.0.1:5000/v1',
        llmModel: 'default',
        maxTokens: 4096,
        temperature: 0.3,
        rephraseTemperature: 0.8,
        topP: 0.9,
        detectionApiUrl: 'http://127.0.0.1:5000/detection',
        plagiarismApiUrl: 'http://127.0.0.1:5000/plagiarism',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown')
    const [savedMessage, setSavedMessage] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, usersRes, settingsRes] = await Promise.all([
                    fetch('/api/admin/analytics'),
                    fetch('/api/admin/users'),
                    fetch('/api/admin/settings'),
                ])

                const analyticsData = await analyticsRes.json()
                const usersData = await usersRes.json()
                const settingsData = await settingsRes.json()

                if (analyticsData.success) {
                    setAnalytics(analyticsData.data)
                }
                if (usersData.success) {
                    setUsers(usersData.data)
                }
                if (settingsData.success) {
                    setSettings(settingsData.data)
                }
            } catch (error) {
                console.error('Failed to fetch admin data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleTestConnection = async () => {
        setTesting(true)
        setConnectionStatus('unknown')
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ llmApiUrl: settings.llmApiUrl }),
            })
            const data = await res.json()
            if (data.success && data.data.connected) {
                setConnectionStatus('connected')
            } else {
                setConnectionStatus('failed')
            }
        } catch {
            setConnectionStatus('failed')
        } finally {
            setTesting(false)
        }
    }

    const handleSaveSettings = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })
            const data = await res.json()
            if (data.success) {
                setSavedMessage('Settings saved successfully!')
                setTimeout(() => setSavedMessage(''), 3000)
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                                    <p className="text-xs text-gray-400">ContentGuard AI</p>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'overview'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4 inline mr-2" />
                                Analytics
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'users'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <UserCircle className="w-4 h-4 inline mr-2" />
                                Users
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'settings'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <Settings className="w-4 h-4 inline mr-2" />
                                LLM Settings
                            </button>
                            <button
                                onClick={() => setActiveTab('whatsapp')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'whatsapp'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <Smartphone className="w-4 h-4 inline mr-2" />
                                WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* WhatsApp Tab */}
                {activeTab === 'whatsapp' && (
                    <WhatsAppDashboard />
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        {savedMessage && (
                            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                                <p className="text-green-400">{savedMessage}</p>
                            </div>
                        )}

                        {/* Detection Services Configuration */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center gap-3 mb-6">
                                <Shield className="w-5 h-5 text-purple-400" />
                                <h2 className="text-lg font-semibold text-white">Detection Services Configuration</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        AI Detection API URL
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.detectionApiUrl}
                                        onChange={(e) => setSettings({ ...settings, detectionApiUrl: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="http://127.0.0.1:5000/detection"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Plagiarism Check API URL
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.plagiarismApiUrl}
                                        onChange={(e) => setSettings({ ...settings, plagiarismApiUrl: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="http://127.0.0.1:5000/plagiarism"
                                    />
                                </div>

                                <button
                                    onClick={handleSaveSettings}
                                    disabled={saving}
                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Save Settings
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Usage Info */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4">Quick Reference</h3>
                            <div className="text-gray-400 text-sm space-y-2">
                                <p>• The LLM API should be OpenAI-compatible (LM Studio, text-generation-webui, etc.)</p>
                                <p>• LM Studio default port is 1234, text-generation-webui is 5000</p>
                                <p>• <strong>Analysis Temperature</strong>: Controls analysis consistency (lower = more reliable)</p>
                                <p>• <strong>Rephrase Temperature</strong>: Controls rewriting creativity (higher = more human-like)</p>
                                <p>• Top P controls diversity via nucleus sampling (0.9 recommended)</p>
                                <p>• Max tokens limits the response length from the LLM</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'overview' && analytics && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <StatCard
                                title="Total Users"
                                value={analytics.overview.totalUsers}
                                subValue={`+${analytics.overview.todayUsers} today`}
                                icon={Users}
                                color="purple"
                            />
                            <StatCard
                                title="Total Conversations"
                                value={analytics.overview.totalConversations}
                                subValue={`+${analytics.overview.todayConversations} today`}
                                icon={MessageSquare}
                                color="pink"
                            />
                            <StatCard
                                title="Total Analyses"
                                value={analytics.overview.totalMessages}
                                subValue={`+${analytics.overview.todayMessages} today`}
                                icon={FileText}
                                color="cyan"
                            />
                            <StatCard
                                title="Weekly Growth"
                                value={analytics.overview.weekUsers}
                                subValue="new users this week"
                                icon={TrendingUp}
                                color="green"
                            />
                        </div>

                        {/* Character Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/30">
                                <div className="flex items-center gap-2 mb-4">
                                    <Type className="w-5 h-5 text-orange-400" />
                                    <span className="text-sm text-gray-400">Total Characters Processed</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{analytics.overview.totalCharacters.toLocaleString()}</p>
                                <p className="text-xs text-gray-500 mt-2">+{analytics.overview.todayCharacters.toLocaleString()} today</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
                                <div className="flex items-center gap-2 mb-4">
                                    <Type className="w-5 h-5 text-blue-400" />
                                    <span className="text-sm text-gray-400">Avg Chars per Message</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{analytics.overview.avgCharPerMessage.toLocaleString()}</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30">
                                <div className="flex items-center gap-2 mb-4">
                                    <Type className="w-5 h-5 text-emerald-400" />
                                    <span className="text-sm text-gray-400">Max Prompt Length</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{analytics.overview.maxCharPerMessage.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Activity Chart */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Daily Activity</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={analytics.dailyStats}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                                            <YAxis stroke="#9ca3af" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1f2937',
                                                    border: '1px solid #374151',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                            <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} />
                                            <Line type="monotone" dataKey="conversations" stroke="#ec4899" strokeWidth={2} />
                                            <Line type="monotone" dataKey="messages" stroke="#06b6d4" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex gap-4 mt-4 text-xs">
                                    <span className="flex items-center gap-2 text-purple-400">
                                        <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                                        Users
                                    </span>
                                    <span className="flex items-center gap-2 text-pink-400">
                                        <span className="w-3 h-3 rounded-full bg-pink-500"></span>
                                        Conversations
                                    </span>
                                    <span className="flex items-center gap-2 text-cyan-400">
                                        <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                                        Messages
                                    </span>
                                </div>
                            </div>

                            {/* User Types Chart */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Users by Type</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analytics.usersByType}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="count"
                                                nameKey="type"
                                            >
                                                {analytics.usersByType.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1f2937',
                                                    border: '1px solid #374151',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {analytics.usersByType.map((item, index) => (
                                        <span key={item.type} className="flex items-center gap-2 text-xs text-gray-400">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            ></span>
                                            {item.type}: {item.count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top Users & Education Level */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Users */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Top Users by Activity</h3>
                                <div className="space-y-3">
                                    {analytics.topUsers.slice(0, 5).map((user, index) => (
                                        <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">{user.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>
                                            <span className="text-purple-400 text-sm font-medium">
                                                {user.conversations} chats
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Education Level Chart */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Users by Education Level</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics.usersByEducation}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="level" stroke="#9ca3af" fontSize={12} />
                                            <YAxis stroke="#9ca3af" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1f2937',
                                                    border: '1px solid #374151',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/10">
                            <h3 className="text-lg font-semibold text-white">All Users</h3>
                            <p className="text-sm text-gray-400">{users.length} total users</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4 text-sm font-medium text-gray-400">User</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-400">Role</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-400">Type</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-400">Education</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-400">Conversations</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-400">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                        <span className="text-white text-sm font-medium">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-2 py-1 rounded-lg text-xs font-medium ${user.role === 'ADMIN'
                                                        ? 'bg-purple-500/20 text-purple-400'
                                                        : 'bg-gray-500/20 text-gray-400'
                                                        }`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-400 text-sm capitalize">{user.userType || '-'}</td>
                                            <td className="p-4 text-gray-400 text-sm capitalize">
                                                {user.educationLevel?.replace('_', ' ') || '-'}
                                            </td>
                                            <td className="p-4 text-gray-400 text-sm">{user._count.conversations}</td>
                                            <td className="p-4 text-gray-400 text-sm">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({
    title,
    value,
    subValue,
    icon: Icon,
    color,
}: {
    title: string
    value: number
    subValue: string
    icon: React.ElementType
    color: 'purple' | 'pink' | 'cyan' | 'green'
}) {
    const colorClasses = {
        purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
        pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
        cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
        green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    }

    const iconColors = {
        purple: 'text-purple-400',
        pink: 'text-pink-400',
        cyan: 'text-cyan-400',
        green: 'text-green-400',
    }

    return (
        <div
            className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl rounded-2xl p-6 border`}
        >
            <div className="flex items-center justify-between mb-4">
                <Icon className={`w-6 h-6 ${iconColors[color]}`} />
            </div>
            <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-1">{title}</p>
            <p className="text-xs text-gray-500 mt-2">{subValue}</p>
        </div>
    )
}
