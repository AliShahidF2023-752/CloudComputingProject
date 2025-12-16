import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { detectAI } from '@/lib/detector'
import { generateConversationTitle } from '@/lib/utils'

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

        // Save user input message
        const userMessage = await prisma.message.create({
            data: {
                conversationId,
                type: 'USER_INPUT',
                content: content.trim(),
                charCount: content.trim().length,
            },
        })

        // Analyze the text using local detector
        const analysisResult = await detectAI(content)

        // Save analysis result message
        const analysisMessage = await prisma.message.create({
            data: {
                conversationId,
                type: 'ANALYSIS_RESULT',
                content: content.trim(),
                analysisData: JSON.stringify(analysisResult),
                charCount: content.trim().length,
            },
        })

        // Update conversation title if it's new
        if (conversation.title === 'New Conversation') {
            const newTitle = generateConversationTitle(content)
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { title: newTitle },
            })
        }

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        })

        return NextResponse.json({
            success: true,
            data: {
                userMessage,
                analysisMessage: {
                    ...analysisMessage,
                    analysisData: analysisResult,
                },
            },
        })
    } catch (error) {
        console.error('Analyze error:', error)
        return NextResponse.json(
            { success: false, error: 'Analysis failed. Please try again.' },
            { status: 500 }
        )
    }
}
