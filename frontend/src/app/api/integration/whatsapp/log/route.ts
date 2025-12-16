import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const { phone, command, content, processingTime } = await req.json()

        await prisma.whatsAppLog.create({
            data: {
                phoneNumber: phone,
                command,
                content: content.substring(0, 500), // Truncate for log storage
                processingTime: processingTime || 0
            }
        })

        return NextResponse.json({ success: true })

    } catch (e) {
        // Logging failure shouldn't stop the flow
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
