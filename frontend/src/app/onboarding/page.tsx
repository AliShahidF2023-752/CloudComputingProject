'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, GraduationCap, Briefcase, PenTool, Users, Loader2 } from 'lucide-react'

const userTypes = [
    { id: 'student', label: 'Student', icon: GraduationCap, description: 'Academic writing and assignments' },
    { id: 'researcher', label: 'Researcher', icon: Briefcase, description: 'Research papers and publications' },
    { id: 'writer', label: 'Writer', icon: PenTool, description: 'Content creation and copywriting' },
    { id: 'other', label: 'Other', icon: Users, description: 'General content needs' },
]

const educationLevels = [
    { id: 'high_school', label: 'High School' },
    { id: 'undergraduate', label: 'Undergraduate' },
    { id: 'graduate', label: 'Graduate / Masters' },
    { id: 'professional', label: 'Professional / PhD' },
]

const tones = [
    { id: 'academic', label: 'Academic', description: 'Scholarly and formal' },
    { id: 'formal', label: 'Formal', description: 'Professional and polished' },
    { id: 'informal', label: 'Informal', description: 'Casual and conversational' },
]

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [preferences, setPreferences] = useState({
        userType: '',
        educationLevel: '',
        defaultTone: 'academic',
    })

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/onboarding', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences),
            })

            const data = await res.json()

            if (data.success) {
                router.push('/dashboard')
            }
        } catch (error) {
            console.error('Onboarding error:', error)
        } finally {
            setLoading(false)
        }
    }

    const canProceed = () => {
        if (step === 1) return preferences.userType !== ''
        if (step === 2) return preferences.educationLevel !== ''
        if (step === 3) return preferences.defaultTone !== ''
        return false
    }

    const nextStep = () => {
        if (step < 3) {
            setStep(step + 1)
        } else {
            handleSubmit()
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Step {step} of 3</span>
                        <span className="text-sm text-gray-400">{Math.round((step / 3) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                    {/* Step 1: User Type */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">What describes you best?</h2>
                                <p className="text-gray-400">This helps us tailor the experience for you.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {userTypes.map((type) => {
                                    const Icon = type.icon
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => setPreferences({ ...preferences, userType: type.id })}
                                            className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${preferences.userType === type.id
                                                    ? 'border-purple-500 bg-purple-500/20'
                                                    : 'border-white/10 bg-white/5 hover:border-white/30'
                                                }`}
                                        >
                                            <Icon className={`w-8 h-8 mb-3 ${preferences.userType === type.id ? 'text-purple-400' : 'text-gray-400'}`} />
                                            <h3 className="text-lg font-semibold text-white">{type.label}</h3>
                                            <p className="text-sm text-gray-400 mt-1">{type.description}</p>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Education Level */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">What&apos;s your education level?</h2>
                                <p className="text-gray-400">We&apos;ll adjust the writing style recommendations accordingly.</p>
                            </div>

                            <div className="space-y-3">
                                {educationLevels.map((level) => (
                                    <button
                                        key={level.id}
                                        onClick={() => setPreferences({ ...preferences, educationLevel: level.id })}
                                        className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left ${preferences.educationLevel === level.id
                                                ? 'border-purple-500 bg-purple-500/20'
                                                : 'border-white/10 bg-white/5 hover:border-white/30'
                                            }`}
                                    >
                                        <h3 className="text-lg font-semibold text-white">{level.label}</h3>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Default Tone */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Choose your default writing tone</h2>
                                <p className="text-gray-400">You can change this for each conversation later.</p>
                            </div>

                            <div className="space-y-3">
                                {tones.map((tone) => (
                                    <button
                                        key={tone.id}
                                        onClick={() => setPreferences({ ...preferences, defaultTone: tone.id })}
                                        className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left ${preferences.defaultTone === tone.id
                                                ? 'border-purple-500 bg-purple-500/20'
                                                : 'border-white/10 bg-white/5 hover:border-white/30'
                                            }`}
                                    >
                                        <h3 className="text-lg font-semibold text-white">{tone.label}</h3>
                                        <p className="text-sm text-gray-400 mt-1">{tone.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={nextStep}
                            disabled={!canProceed() || loading}
                            className="ml-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : step === 3 ? (
                                <>
                                    Get Started
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
