'use client'

import { Bot, FileWarning, CheckCircle } from 'lucide-react'

interface AnalysisReportProps {
    aiPercentage: number
    plagiarismPercentage: number
    originalPercentage: number
    summary: string
}

export default function AnalysisReport({
    aiPercentage,
    plagiarismPercentage,
    originalPercentage,
    summary,
}: AnalysisReportProps) {
    const getColorClass = (percentage: number, type: 'ai' | 'plagiarism' | 'original') => {
        if (type === 'original') {
            if (percentage >= 80) return 'text-green-400'
            if (percentage >= 50) return 'text-yellow-400'
            return 'text-red-400'
        }
        // For AI and plagiarism, lower is better
        if (percentage <= 10) return 'text-green-400'
        if (percentage <= 30) return 'text-yellow-400'
        return 'text-red-400'
    }

    const getBgColorClass = (percentage: number, type: 'ai' | 'plagiarism' | 'original') => {
        if (type === 'original') {
            if (percentage >= 80) return 'bg-green-500'
            if (percentage >= 50) return 'bg-yellow-500'
            return 'bg-red-500'
        }
        if (percentage <= 10) return 'bg-green-500'
        if (percentage <= 30) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    const getStatus = () => {
        if (aiPercentage <= 10 && plagiarismPercentage <= 10) {
            return { text: 'Excellent! Your content appears original.', color: 'text-green-400', icon: CheckCircle }
        }
        if (aiPercentage <= 30 && plagiarismPercentage <= 30) {
            return { text: 'Good, but some improvements recommended.', color: 'text-yellow-400', icon: FileWarning }
        }
        return { text: 'Attention needed. Consider rephrasing.', color: 'text-red-400', icon: FileWarning }
    }

    const status = getStatus()
    const StatusIcon = status.icon

    return (
        <div className="space-y-4">
            {/* Status message */}
            <div className={`flex items-center gap-2 ${status.color}`}>
                <StatusIcon className="w-5 h-5" />
                <span className="font-medium">{status.text}</span>
            </div>

            {/* Percentage bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* AI Content */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-gray-400">AI Content</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className={`text-2xl font-bold ${getColorClass(aiPercentage, 'ai')}`}>
                            {Math.round(aiPercentage)}%
                        </span>
                    </div>
                    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${getBgColorClass(aiPercentage, 'ai')}`}
                            style={{ width: `${aiPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Plagiarism */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <FileWarning className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-400">Plagiarism</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className={`text-2xl font-bold ${getColorClass(plagiarismPercentage, 'plagiarism')}`}>
                            {Math.round(plagiarismPercentage)}%
                        </span>
                    </div>
                    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${getBgColorClass(plagiarismPercentage, 'plagiarism')}`}
                            style={{ width: `${plagiarismPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Original */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-400">Original</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className={`text-2xl font-bold ${getColorClass(originalPercentage, 'original')}`}>
                            {Math.round(originalPercentage)}%
                        </span>
                    </div>
                    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${getBgColorClass(originalPercentage, 'original')}`}
                            style={{ width: `${originalPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Summary */}
            {summary && (
                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Analysis Summary</h4>
                    <p className="text-gray-300 text-sm">{summary}</p>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-red-500/50 border border-red-500"></span>
                    <span>AI-generated content (highlighted in red)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-blue-500/50 border border-blue-500"></span>
                    <span>Potential plagiarism (highlighted in blue)</span>
                </div>
            </div>
        </div>
    )
}
