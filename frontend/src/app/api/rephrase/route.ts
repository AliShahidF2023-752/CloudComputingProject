import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { detectAI } from '@/lib/detector'
import { humanizeText } from '@/lib/humanize'

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { conversationId, content, tone } = await request.json()

        if (!content || !content.trim()) {
            return NextResponse.json(
                { success: false, error: 'Content is required' },
                { status: 400 }
            )
        }

        // Get user info for context
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { educationLevel: true, userType: true },
        })

        const userContext = `${user?.userType || 'user'} at ${user?.educationLevel || 'general'} level`

        // Verify conversation belongs to user
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId: session.userId,
            },
        })

        if (!conversation) {
            return NextResponse.json(
                { success: false, error: 'Conversation not found' },
                { status: 404 }
            )
        }

        // 1. Rule-based Humanization (Paraphrasing)
        // Uses the settings from conversation or defaults

        // 1. Rule-based Humanization (TypeScript Implementation)
        // Uses the settings from conversation or defaults
        // Now runs fully in Node.js, compatible with Digital Ocean App Platform

        const humanizedText = humanizeText(
            content,
            conversation.synonymIntensity,
            conversation.transitionFrequency
        )

        // 2. Local Analysis (Check)
        const analysis = await detectAI(humanizedText)

        // Save rephrased message
        const rephrasedMessage = await prisma.message.create({
            data: {
                conversationId,
                type: 'REPHRASED',
                content: humanizedText,
                analysisData: JSON.stringify(analysis),
                charCount: humanizedText.length,
            },
        })

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        })

        return NextResponse.json({
            success: true,
            data: {
                message: rephrasedMessage,
                iterations: 1, // Single pass with new logic
                analysis: analysis,
            },
        })
    } catch (error) {
        console.error('Rephrase error:', error)
        return NextResponse.json(
            { success: false, error: 'Rephrasing failed. Please try again.' },
            { status: 500 }
        )
    }
}
