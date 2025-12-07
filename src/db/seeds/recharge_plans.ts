import { db } from '@/db';
import { rechargePlans } from '@/db/schema';

async function main() {
    const now = new Date();
    
    // Helper function to create ISO timestamp for days ago
    const daysAgo = (days: number): string => {
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date.toISOString();
    };
    
    // Helper function to create ISO timestamp for days from now
    const daysFromNow = (days: number): string => {
        const date = new Date(now);
        date.setDate(date.getDate() + days);
        return date.toISOString();
    };

    const sampleRechargePlans = [
        // User 1 - Active Plan
        {
            userId: 1,
            validity: 84,
            dataAmount: 84,
            dataMode: '5g',
            voiceCalls: true,
            unlimitedVoice: true,
            ottPlatforms: JSON.stringify(['Netflix', 'Prime Video', 'Disney+ Hotstar']),
            totalCost: 3099,
            pivotPointsEarned: 500,
            status: 'active',
            activatedAt: daysAgo(15),
            expiresAt: daysFromNow(69),
            createdAt: daysAgo(15),
        },
        // User 1 - Expired Plan
        {
            userId: 1,
            validity: 28,
            dataAmount: 2,
            dataMode: '4g',
            voiceCalls: true,
            unlimitedVoice: false,
            ottPlatforms: null,
            totalCost: 239,
            pivotPointsEarned: 50,
            status: 'expired',
            activatedAt: daysAgo(50),
            expiresAt: daysAgo(22),
            createdAt: daysAgo(50),
        },
        // User 2 - Active Plan
        {
            userId: 2,
            validity: 56,
            dataAmount: 6,
            dataMode: '4g',
            voiceCalls: true,
            unlimitedVoice: true,
            ottPlatforms: JSON.stringify(['Amazon Prime', 'Zee5']),
            totalCost: 666,
            pivotPointsEarned: 150,
            status: 'active',
            activatedAt: daysAgo(22),
            expiresAt: daysFromNow(34),
            createdAt: daysAgo(22),
        },
        // User 2 - Expired Plan
        {
            userId: 2,
            validity: 28,
            dataAmount: 1,
            dataMode: '4g',
            voiceCalls: false,
            unlimitedVoice: false,
            ottPlatforms: null,
            totalCost: 199,
            pivotPointsEarned: 40,
            status: 'expired',
            activatedAt: daysAgo(60),
            expiresAt: daysAgo(32),
            createdAt: daysAgo(60),
        },
    ];

    await db.insert(rechargePlans).values(sampleRechargePlans);
    
    console.log('✅ Recharge plans seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});