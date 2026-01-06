import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { detectAI } from '@/lib/detector'
import { PythonShell } from 'python-shell'
import path from 'path'

export async function POST(request: NextRequest) {

    try {
        const session = await getSession()


        if (!session) {

            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()

        const { conversationId, content } = body;

        if (!content || !content.trim()) {

            return NextResponse.json(
                { success: false, error: 'Content is required' },
                { status: 400 }
            )
        }

        // Get user info for context
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { educationLevel: true, userType: true },
        })


        // Verify conversation belongs to user
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId: session.userId,
            },
        })

        if (!conversation) {

            return NextResponse.json(
                { success: false, error: 'Conversation not found' },
                { status: 404 }
            )
        }


        // 1. Python-based Humanization

        const startTime = Date.now();

        // Helper to run Python script
        const runHumanizer = async (text: string, pSyn: number, pTrans: number): Promise<string> => {
            return new Promise((resolve, reject) => {
                const options = {
                    mode: 'text' as const,
                    scriptPath: path.join(process.cwd(), 'detectors'),
                };

                const pyshell = new PythonShell('humanize_cli.py', options);

                const payload = {
                    text: text,
                    p_syn: pSyn,
                    p_trans: pTrans,
                    preserve_linebreaks: true
                };

                // Buffer to collect output
                let outputData = '';

                pyshell.send(JSON.stringify(payload));

                pyshell.on('message', (message) => {
                    outputData += message;
                });

                pyshell.end((err) => {
                    if (err) return reject(err);
                    try {
                        const result = JSON.parse(outputData);
                        if (result.error) {
                            reject(new Error(result.error));
                        } else {
                            resolve(result.humanized_text);
                        }
                    } catch (e) {
                        console.error('Failed to parse Python output:', outputData);
                        reject(e);
                    }
                });
            });
        };

        // Guarantee at least some change if possible
        let currentIntensity = conversation.synonymIntensity || 0.4;
        const currentFrequency = conversation.transitionFrequency || 0.3;



        let humanizedText = await runHumanizer(content, currentIntensity, currentFrequency);

        // Retry with higher intensity if no changes were made
        let attempts = 0;
        while (humanizedText === content && attempts < 2 && currentIntensity < 1.0) {
            attempts++;
            currentIntensity = Math.min(1.0, currentIntensity + 0.3);


            humanizedText = await runHumanizer(content, currentIntensity, currentFrequency);
        }



        // 2. Local Analysis (Check)

        const analysis = await detectAI(humanizedText)


        // Save rephrased message
        const rephrasedMessage = await prisma.message.create({
            data: {
                conversationId,
                type: 'REPHRASED',
                content: humanizedText,
                analysisData: JSON.stringify(analysis),
                charCount: humanizedText.length,
            },
        })


        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        })

        return NextResponse.json({
            success: true,
            data: {
                message: rephrasedMessage,
                iterations: attempts + 1,
                analysis: analysis,
            },
        })
    } catch (error) {
        console.error('[API] Rephrase CRITICAL ERROR:', error)
        return NextResponse.json(
            { success: false, error: 'Rephrasing failed. Please try again.' },
            { status: 500 }
        )
    }
}
