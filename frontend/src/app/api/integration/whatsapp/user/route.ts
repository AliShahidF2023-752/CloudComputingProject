import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/integration/whatsapp/user?phone=...
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')

    if (!phone) {
        return NextResponse.json({ error: 'Phone required' }, { status: 400 })
    }

    try {
        let user = await prisma.whatsAppUser.findUnique({
            where: { phoneNumber: phone }
        })

        if (!user) {
            // Auto-create user on first seen
            user = await prisma.whatsAppUser.create({
                data: { phoneNumber: phone }
            })
        }

        return NextResponse.json(user)

    } catch (e) {
        return NextResponse.json({ error: 'DB Error' }, { status: 500 })
    }
}

// POST /api/integration/whatsapp/user (Update settings)
export async function POST(req: NextRequest) {
    try {
        const { phone, synonymIntensity, transitionFrequency } = await req.json()

        const user = await prisma.whatsAppUser.update({
            where: { phoneNumber: phone },
            data: {
                synonymIntensity: synonymIntensity ?? undefined,
                transitionFrequency: transitionFrequency ?? undefined
            }
        })

        return NextResponse.json(user)
    } catch (e) {
        return NextResponse.json({ error: 'Update Failed' }, { status: 500 })
    }
}
