import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { detectAI } from '@/lib/detector'
import { PythonShell } from 'python-shell'
import path from 'path'

export async function POST(request: NextRequest) {
    console.log('[API] Rephrase request received');
    try {
        const session = await getSession()
        console.log('[API] Session:', session ? 'Authenticated' : 'No session');

        if (!session) {
            console.log('[API] Authentication failed');
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        console.log('[API] Request body keys:', Object.keys(body));
        const { conversationId, content } = body;

        if (!content || !content.trim()) {
            console.log('[API] Missing content');
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
        console.log('[API] User found:', user?.userType);

        // Verify conversation belongs to user
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId: session.userId,
            },
        })

        if (!conversation) {
            console.log('[API] Conversation not found or access denied. ID:', conversationId);
            return NextResponse.json(
                { success: false, error: 'Conversation not found' },
                { status: 404 }
            )
        }
        console.log('[API] Conversation params:', {
            synonymIntensity: conversation.synonymIntensity,
            transitionFrequency: conversation.transitionFrequency
        });

        // 1. Python-based Humanization
        console.log('[API] Starting humanization via Python script...');
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

        console.log(`[API] Initial Intensity: ${currentIntensity}, Frequency: ${currentFrequency}`);

        let humanizedText = await runHumanizer(content, currentIntensity, currentFrequency);

        // Retry with higher intensity if no changes were made
        let attempts = 0;
        while (humanizedText === content && attempts < 2 && currentIntensity < 1.0) {
            attempts++;
            currentIntensity = Math.min(1.0, currentIntensity + 0.3);
            console.log(`[API] No changes detected. Retrying with intensity: ${currentIntensity}`);

            humanizedText = await runHumanizer(content, currentIntensity, currentFrequency);
        }

        console.log('[API] Humanization complete. Time:', Date.now() - startTime, 'ms');
        console.log('[API] Original length:', content.length, 'New length:', humanizedText.length);

        // 2. Local Analysis (Check)
        console.log('[API] Running AI detection on result...');
        const analysis = await detectAI(humanizedText)
        console.log('[API] AI Detection complete. Score:', analysis.aiContentPercentage);

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
        console.log('[API] Message saved:', rephrasedMessage.id);

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
