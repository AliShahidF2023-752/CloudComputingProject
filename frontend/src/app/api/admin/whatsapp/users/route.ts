import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/whatsapp/users - List users with stats
export async function GET(req: NextRequest) {
    // Ideally check for Admin role here using session
    // const session = await getServerSession(authOptions)
    // if (session?.user?.role !== 'ADMIN') return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    try {
        const users = await prisma.whatsAppUser.findMany({
            include: {
                _count: {
                    select: { logs: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Also get total request count for analytics card
        const totalRequests = await prisma.whatsAppLog.count()
        const recentLogs = await prisma.whatsAppLog.findMany({
            take: 20,
            orderBy: { processedAt: 'desc' }
        })

        return NextResponse.json({ users, totalRequests, recentLogs })

    } catch (e) {
        return NextResponse.json({ error: 'DB Error' }, { status: 500 })
    }
}

// POST /api/admin/whatsapp/block - Toggle block status
export async function POST(req: NextRequest) {
    try {
        const { phone, isBlocked } = await req.json()

        const user = await prisma.whatsAppUser.update({
            where: { phoneNumber: phone },
            data: { isBlocked }
        })

        return NextResponse.json(user)
    } catch (e) {
        return NextResponse.json({ error: 'Update Failed' }, { status: 500 })
    }
}
