import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const twentyFiveDaysAgo = new Date();
    twentyFiveDaysAgo.setDate(twentyFiveDaysAgo.getDate() - 25);
    
    const now = new Date();

    const hashedPassword = await bcrypt.hash('password123', 10);

    const sampleUsers = [
        {
            name: 'Sainadh Kumar',
            email: 'sainadh@pivot.com',
            phone: '+12345678900',
            password: hashedPassword,
            dataBalance: 15.5,
            pivotPoints: 1250,
            twoFactorEnabled: false,
            twoFactorMethod: 'sms',
            udi: '@sainadh',
            createdAt: thirtyDaysAgo.toISOString(),
            updatedAt: now.toISOString(),
        },
        {
            name: 'Priya Sharma',
            email: 'priya@pivot.com',
            phone: '+19876543210',
            password: hashedPassword,
            dataBalance: 22.3,
            pivotPoints: 2480,
            twoFactorEnabled: true,
            twoFactorMethod: 'email',
            udi: '@priya',
            createdAt: twentyFiveDaysAgo.toISOString(),
            updatedAt: now.toISOString(),
        },
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});