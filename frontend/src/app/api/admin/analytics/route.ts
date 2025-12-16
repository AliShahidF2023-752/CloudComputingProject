import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

// Admin: Get analytics data
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

        // Get various stats
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)

        const [
            totalUsers,
            todayUsers,
            weekUsers,
            totalConversations,
            todayConversations,
            totalMessages,
            todayMessages,
            usersByType,
            usersByEducation,
            charCountStats,
            totalCharacters,
            todayCharacters,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({
                where: { createdAt: { gte: todayStart } },
            }),
            prisma.user.count({
                where: { createdAt: { gte: weekStart } },
            }),
            prisma.conversation.count(),
            prisma.conversation.count({
                where: { createdAt: { gte: todayStart } },
            }),
            prisma.message.count(),
            prisma.message.count({
                where: { createdAt: { gte: todayStart } },
            }),
            prisma.user.groupBy({
                by: ['userType'],
                _count: true,
            }),
            prisma.user.groupBy({
                by: ['educationLevel'],
                _count: true,
            }),
            prisma.message.aggregate({
                _sum: { charCount: true },
                _avg: { charCount: true },
                _max: { charCount: true },
            }),
            prisma.message.aggregate({
                _sum: { charCount: true },
            }),
            prisma.message.aggregate({
                _sum: { charCount: true },
                where: { createdAt: { gte: todayStart } },
            }),
        ])

        // Get daily stats for the last 7 days
        const dailyStats = []
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000)
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

            const [users, conversations, messages, charStats] = await Promise.all([
                prisma.user.count({
                    where: { createdAt: { gte: dayStart, lt: dayEnd } },
                }),
                prisma.conversation.count({
                    where: { createdAt: { gte: dayStart, lt: dayEnd } },
                }),
                prisma.message.count({
                    where: { createdAt: { gte: dayStart, lt: dayEnd } },
                }),
                prisma.message.aggregate({
                    _sum: { charCount: true },
                    where: { createdAt: { gte: dayStart, lt: dayEnd } },
                }),
            ])

            dailyStats.push({
                date: dayStart.toISOString().split('T')[0],
                users,
                conversations,
                messages,
                characters: charStats._sum.charCount || 0,
            })
        }

        // Get top users by usage
        const topUsers = await prisma.user.findMany({
            take: 10,
            select: {
                id: true,
                name: true,
                email: true,
                _count: {
                    select: { conversations: true },
                },
            },
            orderBy: {
                conversations: {
                    _count: 'desc',
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    todayUsers,
                    weekUsers,
                    totalConversations,
                    todayConversations,
                    totalMessages,
                    todayMessages,
                    totalCharacters: totalCharacters._sum.charCount || 0,
                    todayCharacters: todayCharacters._sum.charCount || 0,
                    avgCharPerMessage: Math.round(charCountStats._avg.charCount || 0),
                    maxCharPerMessage: charCountStats._max.charCount || 0,
                },
                usersByType: usersByType.map((item: { userType: string | null; _count: number }) => ({
                    type: item.userType || 'unknown',
                    count: item._count,
                })),
                usersByEducation: usersByEducation.map((item: { educationLevel: string | null; _count: number }) => ({
                    level: item.educationLevel || 'unknown',
                    count: item._count,
                })),
                dailyStats,
                topUsers: topUsers.map((user: { id: string; name: string; email: string; _count: { conversations: number } }) => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    conversations: user._count.conversations,
                })),
            },
        })
    } catch (error) {
        console.error('Get analytics error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch analytics' },
            { status: 500 }
        )
    }
}
