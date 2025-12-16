import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const { content, phone } = await request.json()

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 })
        }

        // Get user settings
        const user = await prisma.whatsAppUser.findUnique({
            where: { phoneNumber: phone }
        })

        const p_syn = user?.synonymIntensity || 0.2
        const p_trans = user?.transitionFrequency || 0.2

        // Spawn python process (similar to main API but without auth session requirement)
        const { spawn } = await import('child_process');
        const path = await import('path');

        // Locate backend script (we are in frontend/src/app/api/... so go up to backend)
        const scriptPath = path.join(process.cwd(), '..', 'backend', 'detectors', 'humanize_cli.py');
        const pythonCmd = process.env.PYTHON_PATH || '/opt/homebrew/bin/python3';

        const pythonProcess = spawn(pythonCmd, [scriptPath]);

        const inputData = JSON.stringify({
            text: content,
            p_syn: p_syn,
            p_trans: p_trans,
            preserve_linebreaks: true
        });

        let scriptOutput = '';

        const humanizedText = await new Promise<string>((resolve) => {
            let timeoutId: NodeJS.Timeout;

            // 30s timeout
            timeoutId = setTimeout(() => {
                pythonProcess.kill();
                resolve("Error: Rephrase Timed Out");
            }, 30000);

            pythonProcess.stdout.on('data', (data) => {
                scriptOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                clearTimeout(timeoutId);

                try {
                    const lines = scriptOutput.trim().split('\n');
                    let jsonResult = null;

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

                    if (jsonResult?.humanized_text) {
                        resolve(jsonResult.humanized_text);
                    } else {
                        resolve(content); // Fallback
                    }
                } catch (e) {
                    resolve(content);
                }
            });

            pythonProcess.stdin.write(inputData);
            pythonProcess.stdin.end();
        });

        return NextResponse.json({ humanizedText })

    } catch (error) {
        console.error('WhatsApp Rephrase error:', error)
        return NextResponse.json({ error: 'Rephrase Failed' }, { status: 500 })
    }
}
