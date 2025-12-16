'use client'

import { useState, useEffect } from 'react'
import { Loader2, Shield, Ban, CheckCircle, Activity, Smartphone } from 'lucide-react'

interface WhatsAppUser {
    phoneNumber: string
    isBlocked: boolean
    synonymIntensity: number
    transitionFrequency: number
    updatedAt: string
    _count?: { logs: number }
}

interface WhatsAppLog {
    id: string
    command: string
    processedAt: string
    processingTime: number
}

export default function WhatsAppDashboard() {
    const [users, setUsers] = useState<WhatsAppUser[]>([])
    const [logs, setLogs] = useState<WhatsAppLog[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/whatsapp/users')
            const data = await res.json()
            if (data.users) {
                setUsers(data.users)
                setLogs(data.recentLogs)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const toggleBlock = async (phone: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/admin/whatsapp/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, isBlocked: !currentStatus })
            })
            if (res.ok) {
                fetchData() // Refresh
            }
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading WhatsApp Data...</div>

    return (
        <div className="space-y-6 text-white p-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                    <Smartphone className="w-8 h-8 text-green-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">WhatsApp Integration</h2>
                    <p className="text-gray-400">Manage bot users and view analytics</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 p-6 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-300">Active Users</h3>
                        <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold">{users.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-300">Blocked Users</h3>
                        <Ban className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-3xl font-bold">{users.filter(u => u.isBlocked).length}</p>
                </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-semibold">User Management</h3>
                    <button onClick={fetchData} className="text-xs bg-white/5 px-2 py-1 rounded hover:bg-white/10">Refresh</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Phone</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Tone Setting</th>
                                <th className="px-6 py-3">Requests</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {users.map((user) => (
                                <tr key={user.phoneNumber} className="hover:bg-white/5">
                                    <td className="px-6 py-4 font-mono">{user.phoneNumber}</td>
                                    <td className="px-6 py-4">
                                        {user.isBlocked ? (
                                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-xs">Blocked</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs">Active</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        S: {user.synonymIntensity} | T: {user.transitionFrequency}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user._count?.logs || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleBlock(user.phoneNumber, user.isBlocked)}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${user.isBlocked
                                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                                }`}
                                        >
                                            {user.isBlocked ? 'Unblock' : 'Block'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No usage data yet. Run the bot and send a message!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
