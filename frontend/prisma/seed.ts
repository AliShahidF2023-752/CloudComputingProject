import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create admin user
    const hashedPassword = await bcrypt.hash('test', 12)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@contentguard.ai' },
        update: {},
        create: {
            email: 'admin@contentguard.ai',
            password: hashedPassword,
            name: 'Admin User',
            role: 'ADMIN',
            onboarded: true,
            educationLevel: 'professional',
            userType: 'researcher',
            defaultTone: 'academic',
        },
    })

    console.log('✅ Created admin user:', admin.email)

    // Create a sample user
    const userPassword = await bcrypt.hash('user123', 12)

    const user = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            password: userPassword,
            name: 'Sample User',
            role: 'USER',
            onboarded: true,
            educationLevel: 'undergraduate',
            userType: 'student',
            defaultTone: 'academic',
        },
    })

    console.log('✅ Created sample user:', user.email)

    // Create a sample conversation for the user
    const conversation = await prisma.conversation.create({
        data: {
            userId: user.id,
            title: 'My First Analysis',
            tone: 'academic',
            messages: {
                create: [
                    {
                        type: 'USER_INPUT',
                        content: 'This is a sample text that I want to analyze for AI content and plagiarism.',
                    },
                    {
                        type: 'ANALYSIS_RESULT',
                        content: 'This is a sample text that I want to analyze for AI content and plagiarism.',
                        analysisData: JSON.stringify({
                            aiContentPercentage: 15,
                            plagiarismPercentage: 5,
                            originalPercentage: 80,
                            highlights: [],
                            summary: 'Your content appears mostly original with minor AI patterns detected.',
                        }),
                    },
                ],
            },
        },
    })

    console.log('✅ Created sample conversation:', conversation.title)

    // Create default system settings
    const settings = await prisma.systemSettings.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            llmApiUrl: 'http://127.0.0.1:5000/v1',
            llmModel: 'default',
            maxTokens: 4096,
            temperature: 0.3,
        },
    })

    console.log('✅ Created system settings with LLM URL:', settings.llmApiUrl)

    console.log('')
    console.log('🎉 Database seeded successfully!')
    console.log('')
    console.log('📧 Admin Login:')
    console.log('   Email: admin@contentguard.ai')
    console.log('   Password: test')
    console.log('')
    console.log('📧 User Login:')
    console.log('   Email: user@example.com')
    console.log('   Password: user123')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
