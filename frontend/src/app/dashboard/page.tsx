'use client'

import { Suspense } from 'react'
import DashboardContent from './DashboardContent'

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <DashboardContent />
        </Suspense>
    )
}
