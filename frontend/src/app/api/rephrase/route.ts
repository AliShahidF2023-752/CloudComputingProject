import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { detectAI } from '@/lib/detector'
import { humanizeText } from '@/lib/humanize'

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { conversationId, content, tone } = await request.json()

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

        const userContext = `${user?.userType || 'user'} at ${user?.educationLevel || 'general'} level`

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

        // 1. Rule-based Humanization (Paraphrasing)
        // Uses the settings from conversation or defaults

        // 1. Rule-based Humanization via Local Python Script
        // We spawn a python process to run detectors/humanize_cli.py
        const { spawn } = await import('child_process');
        const path = await import('path');

        // Since we moved detectors to 'frontend/detectors'
        // process.cwd() in Next.js points to the root of the project (frontend dir)
        const scriptPath = path.join(process.cwd(), 'detectors', 'humanize_cli.py');



        const pythonCmd = process.env.PYTHON_PATH || 'python';
        const pythonProcess = spawn(pythonCmd, [scriptPath]);


        const inputData = JSON.stringify({
            text: content,
            p_syn: conversation.synonymIntensity,
            p_trans: conversation.transitionFrequency,
            preserve_linebreaks: true
        });

        let scriptOutput = '';
        let scriptError = '';

        const humanizedText = await new Promise<string>((resolve, reject) => {
            let timeoutId: NodeJS.Timeout;

            // Set a 30-second timeout to prevent indefinite hanging
            timeoutId = setTimeout(() => {
                console.error('Rephrase timed out');
                pythonProcess.kill();
                resolve(content); // Fallback to original content
            }, 30000);

            pythonProcess.stdout.on('data', (data) => {
                scriptOutput += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                scriptError += data.toString();
            });

            pythonProcess.on('close', (code) => {
                clearTimeout(timeoutId);

                if (code !== 0) {
                    console.error('Humanizer script error output:', scriptError);
                    console.warn('Falling back to original content due to humanizer script failure.');
                    return resolve(content);
                }

                try {
                    // Script might print other things (like NLTK download logs) before the JSON
                    // Find the last JSON object in the output
                    const lines = scriptOutput.trim().split('\n');
                    let jsonResult = null;

                    // Try parsing from the last line backwards
                    for (let i = lines.length - 1; i >= 0; i--) {
                        try {
                            const trimmed = lines[i].trim();
                            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                                jsonResult = JSON.parse(trimmed);
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }

                    if (!jsonResult) {
                        try {
                            // Try parsing the whole output if splitting by newline failed
                            jsonResult = JSON.parse(scriptOutput);
                        } catch (e) {
                            // Failed
                        }
                    }

                    if (jsonResult && jsonResult.error) {
                        console.error('Humanizer script returned error:', jsonResult.error);
                        resolve(content);
                    } else if (jsonResult && jsonResult.humanized_text) {
                        resolve(jsonResult.humanized_text);
                    } else {
                        console.warn('No valid JSON output found from humanizer');
                        resolve(content);
                    }
                } catch (e) {
                    console.error('Failed to parse humanizer output:', e);
                    resolve(content);
                }
            });

            // Write input and end stream
            pythonProcess.stdin.write(inputData);
            pythonProcess.stdin.end();
        });

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
                iterations: 1, // Single pass with new logic
                analysis: analysis,
            },
        })
    } catch (error) {
        console.error('Rephrase error:', error)
        return NextResponse.json(
            { success: false, error: 'Rephrasing failed. Please try again.' },
            { status: 500 }
        )
    }
}
