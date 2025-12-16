import { NextRequest, NextResponse } from 'next/server'
import { detectAI } from '@/lib/detector'

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json()

        if (!text) {
            return NextResponse.json({ error: 'Text required' }, { status: 400 })
        }

        const analysis = await detectAI(text)
        return NextResponse.json(analysis)

    } catch (e) {
        console.error("WhatsApp Detect Error", e)
        return NextResponse.json({ error: 'Detection Failed' }, { status: 500 })
    }
}
