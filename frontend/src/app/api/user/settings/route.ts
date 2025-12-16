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

        const { name, educationLevel, userType, defaultTone } = await request.json()

        const user = await prisma.user.update({
            where: { id: session.userId },
            data: {
                ...(name && { name }),
                ...(educationLevel !== undefined && { educationLevel }),
                ...(userType !== undefined && { userType }),
                ...(defaultTone && { defaultTone }),
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
        console.error('Update settings error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update settings' },
            { status: 500 }
        )
    }
}
