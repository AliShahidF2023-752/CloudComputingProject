'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, User, GraduationCap, MessageSquare, Trash2 } from 'lucide-react'

interface UserData {
    id: string
    name: string
    email: string
    educationLevel: string | null
    userType: string | null
    defaultTone: string
}

const educationLevels = [
    { id: 'high_school', label: 'High School' },
    { id: 'undergraduate', label: 'Undergraduate' },
    { id: 'graduate', label: 'Graduate / Masters' },
    { id: 'professional', label: 'Professional / PhD' },
]

const userTypes = [
    { id: 'student', label: 'Student' },
    { id: 'researcher', label: 'Researcher' },
    { id: 'writer', label: 'Writer' },
    { id: 'other', label: 'Other' },
]

const tones = [
    { id: 'academic', label: 'Academic' },
    { id: 'formal', label: 'Formal' },
    { id: 'informal', label: 'Informal' },
]

export default function SettingsPage() {
    const router = useRouter()
    const [user, setUser] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        educationLevel: '',
        userType: '',
        defaultTone: 'academic',
    })

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me')
                const data = await res.json()
                if (data.success) {
                    setUser(data.data)
                    setFormData({
                        name: data.data.name,
                        educationLevel: data.data.educationLevel || '',
                        userType: data.data.userType || '',
                        defaultTone: data.data.defaultTone,
                    })
                }
            } catch (error) {
                console.error('Failed to fetch user:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUser()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()
            if (data.success) {
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
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
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-2xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Settings</h1>
                        <p className="text-gray-400">Manage your account and preferences</p>
                    </div>
                </div>

                {/* Success message */}
                {saved && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 mb-6">
                        <p className="text-green-400">Settings saved successfully!</p>
                    </div>
                )}

                {/* Profile section */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <User className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">Profile Information</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>
                    </div>
                </div>

                {/* Education section */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <GraduationCap className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">Education & Role</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">I am a</label>
                            <div className="grid grid-cols-2 gap-2">
                                {userTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setFormData({ ...formData, userType: type.id })}
                                        className={`p-3 rounded-xl border transition-all ${formData.userType === type.id
                                            ? 'border-purple-500 bg-purple-500/20 text-white'
                                            : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Education Level</label>
                            <div className="grid grid-cols-2 gap-2">
                                {educationLevels.map((level) => (
                                    <button
                                        key={level.id}
                                        onClick={() => setFormData({ ...formData, educationLevel: level.id })}
                                        className={`p-3 rounded-xl border transition-all ${formData.educationLevel === level.id
                                            ? 'border-purple-500 bg-purple-500/20 text-white'
                                            : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {level.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tone section */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">Default Writing Tone</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {tones.map((tone) => (
                            <button
                                key={tone.id}
                                onClick={() => setFormData({ ...formData, defaultTone: tone.id })}
                                className={`p-3 rounded-xl border transition-all ${formData.defaultTone === tone.id
                                    ? 'border-purple-500 bg-purple-500/20 text-white'
                                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {tone.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Save button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Changes
                        </>
                    )}
                </button>

                {/* Danger zone */}
                <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20 mt-8">
                    <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button className="px-4 py-2 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    )
}
