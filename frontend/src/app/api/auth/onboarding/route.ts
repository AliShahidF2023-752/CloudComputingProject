import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { educationLevel, userType, defaultTone } = await request.json()

        const user = await prisma.user.update({
            where: { id: session.userId },
            data: {
                educationLevel,
                userType,
                defaultTone: defaultTone || 'academic',
                onboarded: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                educationLevel: true,
                userType: true,
                defaultTone: true,
                onboarded: true,
            },
        })

        return NextResponse.json({ success: true, data: user })
    } catch (error) {
        console.error('Onboarding error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to save preferences' },
            { status: 500 }
        )
    }
}
