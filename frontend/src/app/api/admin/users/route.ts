import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

// Admin: Get all users
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

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                educationLevel: true,
                userType: true,
                onboarded: true,
                createdAt: true,
                _count: {
                    select: { conversations: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ success: true, data: users })
    } catch (error) {
        console.error('Get users error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}
