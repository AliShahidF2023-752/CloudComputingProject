import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import axios from 'axios';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

// Health Check Server
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('WhatsApp Bot Active'));
app.get('/health', (req, res) => res.send('OK'));

app.listen(port, () => {
    console.log(`Health check server listening on port ${port}`);
});

// Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_BASE = `${FRONTEND_URL}/api/integration/whatsapp`;

// Initialize Client
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'contentguard',
        dataPath: process.env.WHATSAPP_AUTH_PATH || './.wwebjs_auth'
    }),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-extensions',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
    }
});

// QR Code Generation
client.on('qr', (qr: string) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
    console.log('Please scan the QR code to authenticate.');
});

// Ready Event
client.on('ready', () => {
    console.log('WhatsApp Bot is Ready!');
});

// Message Handling
client.on('message', async (msg: any) => {
    // Ignore status updates/broadcasts
    if (msg.from === 'status@broadcast') return;

    // const contact = await msg.getContact();
    // const phone = contact.number;
    // Fix for "window.Store.ContactMethods.getIsMyContact is not a function" error
    const phone = msg.from.replace('@c.us', '');
    const body = msg.body.trim();

    // 1. Check User Status (Allow/Block)
    try {
        const userCheck = await axios.get(`${API_BASE}/user?phone=${phone}`);
        const user = userCheck.data;

        if (user.isBlocked) {
            // value user privacy, maybe don't reply or say blocked
            // await msg.reply("You are not authorized to use this bot.");
            return;
        }
    } catch (e) {
        console.error("Failed to check user:", e);
        // Continue? Or fail safe?
    }

    // 2. Command Parsing
    const startTime = Date.now();
    let command = 'unknown';

    try {
        // Normalize body
        const lowerBody = body.toLowerCase();

        // Check if it's a command
        const isCommand = body.startsWith('/');

        if (lowerBody === 'hi' || lowerBody === 'hello' || lowerBody === '/start' || lowerBody === '/help' || !isCommand) {
            command = '/help';
            await msg.reply(`*ContentGuard AI Bot* 🤖

Hello! I can help you detect AI content and humanize text.
            
*Available Commands:*
1. */aicheck <text>* - Check for AI content
2. */rephrase <text>* - Humanize text
3. */set synonym <0.0-1.0>* - Set synonym intensity
4. */set transition <0.0-1.0>* - Set transition frequency
5. */profile* - View your settings

_Just send me a command to get started!_`);
        }
        else if (body.startsWith('/aicheck')) {
            command = '/aicheck';
            const text = body.replace('/aicheck', '').trim();
            if (!text) {
                await msg.reply("Please provide text: `/aicheck This is some text.`");
            } else {
                await msg.reply("🔍 Analyzing...");
                const res = await axios.post(`${API_BASE}/detect`, { text });
                const { aiContentPercentage, summary, highlights } = res.data;

                let response = `*Analysis Result:*\nAI Score: *${aiContentPercentage}%*\n${summary}`;

                if (highlights && highlights.length > 0) {
                    response += `\n\n*Highlighted Segments:*`;
                    highlights.forEach((h: any, i: number) => {
                        if (i < 3) response += `\n- "${h.text.substring(0, 50)}..." (${Math.round(h.confidence * 100)}%)`;
                    });
                    if (highlights.length > 3) response += `\n...and ${highlights.length - 3} more.`;
                }

                await msg.reply(response);
            }
        }
        else if (body.startsWith('/rephrase')) {
            command = '/rephrase';
            const text = body.replace('/rephrase', '').trim();
            if (!text) {
                await msg.reply("Please provide text: `/rephrase This is some text.`");
            } else {
                await msg.reply("✍️ Humanizing... (this may take a few seconds)");
                const res = await axios.post(`${API_BASE}/rephrase`, { content: text, phone });
                const { humanizedText, error } = res.data;

                if (error) {
                    await msg.reply(`Error: ${error}`);
                } else {
                    await msg.reply(humanizedText);
                }
            }
        }
        else if (body.startsWith('/set')) {
            command = '/set';
            const parts = body.split(' ');
            if (parts.length === 3) {
                const setting = parts[1].toLowerCase();
                const value = parseFloat(parts[2]);

                if (setting === 'synonym' || setting === 'synonym-intensity') {
                    if (value >= 0 && value <= 1) {
                        await axios.post(`${API_BASE}/user`, { phone, synonymIntensity: value });
                        await msg.reply(`✅ Synonym Intensity set to ${value}`);
                    } else {
                        await msg.reply("Value must be between 0.0 and 1.0");
                    }
                } else if (setting === 'transition' || setting === 'transition-frequency') {
                    if (value >= 0 && value <= 1) {
                        await axios.post(`${API_BASE}/user`, { phone, transitionFrequency: value });
                        await msg.reply(`✅ Transition Frequency set to ${value}`);
                    } else {
                        await msg.reply("Value must be between 0.0 and 1.0");
                    }
                } else {
                    await msg.reply("Unknown setting. Use 'synonym' or 'transition'.");
                }
            } else {
                await msg.reply("Usage: `/set synonym 0.5` or `/set transition 0.3`");
            }
        }
        else if (body.startsWith('/profile')) {
            command = '/profile';
            const userRes = await axios.get(`${API_BASE}/user?phone=${phone}`);
            const u = userRes.data;
            await msg.reply(`*Your Profile*:
Phone: ${u.phoneNumber}
Synonym Intensity: ${u.synonymIntensity}
Transition Frequency: ${u.transitionFrequency}`);
        }

        // 3. Analytics Logging
        if (command !== 'unknown') {
            await axios.post(`${API_BASE}/log`, {
                phone,
                command,
                content: body.substring(0, 100), // Log snippet
                processingTime: Date.now() - startTime
            });
        }
    } catch (e) {
        console.error("Processing Error", e);
        await msg.reply("⚠️ An error occurred processing your request.");
    }
});

client.initialize();
