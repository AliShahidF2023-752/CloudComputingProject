import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

// Get system settings
export async function GET() {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Verify admin role
        const currentUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: true },
        })

        if (currentUser?.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            )
        }

        // Get or create default settings
        let settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' },
        })

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    id: 'default',
                    llmApiUrl: 'http://127.0.0.1:5000/v1',
                    llmModel: 'default',
                    maxTokens: 4096,
                    temperature: 0.3,
                    rephraseTemperature: 0.8,
                    topP: 0.9,
                    detectionApiUrl: 'http://127.0.0.1:5000/detection',
                    plagiarismApiUrl: 'http://127.0.0.1:5000/plagiarism',
                },
            })
        }

        return NextResponse.json({ success: true, data: settings })
    } catch (error) {
        console.error('Get settings error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch settings' },
            { status: 500 }
        )
    }
}

// Update system settings
export async function PUT(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Verify admin role
        const currentUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: true },
        })

        if (currentUser?.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            )
        }

        const { llmApiUrl, llmModel, maxTokens, temperature, rephraseTemperature, topP, detectionApiUrl, plagiarismApiUrl } = await request.json()

        const settings = await prisma.systemSettings.upsert({
            where: { id: 'default' },
            update: {
                ...(llmApiUrl && { llmApiUrl }),
                ...(llmModel && { llmModel }),
                ...(maxTokens !== undefined && { maxTokens }),
                ...(temperature !== undefined && { temperature }),
                ...(rephraseTemperature !== undefined && { rephraseTemperature }),
                ...(topP !== undefined && { topP }),
                ...(detectionApiUrl && { detectionApiUrl }),
                ...(plagiarismApiUrl && { plagiarismApiUrl }),
            },
            create: {
                id: 'default',
                llmApiUrl: llmApiUrl || 'http://127.0.0.1:5000/v1',
                llmModel: llmModel || 'default',
                maxTokens: maxTokens || 4096,
                temperature: temperature || 0.3,
                rephraseTemperature: rephraseTemperature || 0.8,
                topP: topP || 0.9,
                detectionApiUrl: detectionApiUrl || 'http://127.0.0.1:5000/detection',
                plagiarismApiUrl: plagiarismApiUrl || 'http://127.0.0.1:5000/plagiarism',
            },
        })

        return NextResponse.json({ success: true, data: settings })
    } catch (error) {
        console.error('Update settings error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update settings' },
            { status: 500 }
        )
    }
}

// Test LLM connection
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Verify admin role
        const currentUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: true },
        })

        if (currentUser?.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            )
        }

        const { llmApiUrl } = await request.json()

        // Try to connect to the LLM API
        try {
            const response = await fetch(`${llmApiUrl}/models`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })

            if (response.ok) {
                const data = await response.json()
                return NextResponse.json({
                    success: true,
                    data: {
                        connected: true,
                        models: data.data || [],
                    },
                })
            } else {
                return NextResponse.json({
                    success: true,
                    data: {
                        connected: false,
                        error: `HTTP ${response.status}`,
                    },
                })
            }
        } catch (fetchError) {
            return NextResponse.json({
                success: true,
                data: {
                    connected: false,
                    error: 'Connection failed - is the LLM server running?',
                },
            })
        }
    } catch (error) {
        console.error('Test connection error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to test connection' },
            { status: 500 }
        )
    }
}
