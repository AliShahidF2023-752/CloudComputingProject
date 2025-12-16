import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

// Get all conversations for the current user
export async function GET() {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const conversations = await prisma.conversation.findMany({
            where: { userId: session.userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        return NextResponse.json({ success: true, data: conversations })
    } catch (error) {
        console.error('Get conversations error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch conversations' },
            { status: 500 }
        )
    }
}

// Create a new conversation
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { title, tone } = await request.json()

        const conversation = await prisma.conversation.create({
            data: {
                userId: session.userId,
                title: title || 'New Conversation',
                tone: tone || 'academic',
            },
        })

        return NextResponse.json({ success: true, data: conversation })
    } catch (error) {
        console.error('Create conversation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create conversation' },
            { status: 500 }
        )
    }
}
