import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

// Get single conversation with messages
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        const { id } = await params

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const conversation = await prisma.conversation.findFirst({
            where: {
                id,
                userId: session.userId,
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        })

        if (!conversation) {
            return NextResponse.json(
                { success: false, error: 'Conversation not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, data: conversation })
    } catch (error) {
        console.error('Get conversation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch conversation' },
            { status: 500 }
        )
    }
}

// Update conversation
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        const { id } = await params

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { title, tone, synonymIntensity, transitionFrequency } = await request.json()

        const conversation = await prisma.conversation.updateMany({
            where: {
                id,
                userId: session.userId,
            },
            data: {
                ...(title && { title }),
                ...(tone && { tone }),
                ...(synonymIntensity !== undefined && { synonymIntensity }),
                ...(transitionFrequency !== undefined && { transitionFrequency }),
            },
        })

        if (conversation.count === 0) {
            return NextResponse.json(
                { success: false, error: 'Conversation not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Update conversation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update conversation' },
            { status: 500 }
        )
    }
}

// Delete conversation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        const { id } = await params

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        await prisma.conversation.deleteMany({
            where: {
                id,
                userId: session.userId,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete conversation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete conversation' },
            { status: 500 }
        )
    }
}
