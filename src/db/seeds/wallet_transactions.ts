import { db } from '@/db';
import { walletTransactions } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const sampleWalletTransactions = [
        // User 1 Transactions
        {
            userId: 1,
            type: 'bonus',
            amount: 300,
            description: 'Welcome bonus',
            createdAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 1,
            type: 'earned',
            amount: 500,
            description: 'Recharge reward - ₹3099 plan',
            createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 1,
            type: 'earned',
            amount: 100,
            description: 'Referral reward',
            createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 1,
            type: 'spent',
            amount: -25,
            description: 'Data transfer fee',
            createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 1,
            type: 'spent',
            amount: -50,
            description: 'Data transfer fee to @priya',
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        // User 2 Transactions
        {
            userId: 2,
            type: 'bonus',
            amount: 500,
            description: 'Welcome bonus',
            createdAt: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 2,
            type: 'earned',
            amount: 350,
            description: 'Recharge reward - ₹666 plan',
            createdAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 2,
            type: 'earned',
            amount: 250,
            description: 'Recharge reward - ₹299 plan',
            createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 2,
            type: 'spent',
            amount: -75,
            description: 'Data transfer fee to @sainadh',
            createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 2,
            type: 'spent',
            amount: -40,
            description: 'Data transfer fee',
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    await db.insert(walletTransactions).values(sampleWalletTransactions);
    
    console.log('✅ Wallet transactions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});