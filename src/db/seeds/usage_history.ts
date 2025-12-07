import { db } from '@/db';
import { usageHistory } from '@/db/schema';

async function main() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const categories = ['Streaming', 'Social', 'Work', 'Gaming'];
    
    const getRandomUsage = (isWeekend: boolean, userType: 'user1' | 'user2'): number => {
        if (userType === 'user1') {
            if (isWeekend) {
                return Number((Math.random() * (2.5 - 1.5) + 1.5).toFixed(2));
            }
            return Number((Math.random() * (1.5 - 0.5) + 0.5).toFixed(2));
        } else {
            if (isWeekend) {
                return Number((Math.random() * (3.0 - 2.0) + 2.0).toFixed(2));
            }
            return Number((Math.random() * (2.0 - 0.8) + 0.8).toFixed(2));
        }
    };

    const getCategoryForUser = (dayIndex: number, userType: 'user1' | 'user2'): string => {
        if (userType === 'user1') {
            const rand = dayIndex % 10;
            if (rand < 4) return 'Streaming';
            if (rand < 7) return 'Social';
            if (rand < 9) return 'Work';
            return 'Gaming';
        } else {
            const rand = dayIndex % 10;
            if (rand < 5) return 'Streaming';
            if (rand < 7) return 'Social';
            if (rand < 9) return 'Work';
            return 'Gaming';
        }
    };

    const user1History = [];
    for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(thirtyDaysAgo.getDate() + i);
        
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        const dateStr = date.toISOString().split('T')[0];
        const gbUsed = getRandomUsage(isWeekend, 'user1');
        const primaryCategory = getCategoryForUser(i, 'user1');
        
        user1History.push({
            userId: 1,
            date: dateStr,
            gbUsed: gbUsed,
            primaryCategory: primaryCategory,
            createdAt: date.toISOString(),
        });
    }

    const user2History = [];
    for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(thirtyDaysAgo.getDate() + i);
        
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        const dateStr = date.toISOString().split('T')[0];
        const gbUsed = getRandomUsage(isWeekend, 'user2');
        const primaryCategory = getCategoryForUser(i, 'user2');
        
        user2History.push({
            userId: 2,
            date: dateStr,
            gbUsed: gbUsed,
            primaryCategory: primaryCategory,
            createdAt: date.toISOString(),
        });
    }

    const allHistory = [...user1History, ...user2History];
    
    await db.insert(usageHistory).values(allHistory);
    
    console.log('✅ Usage history seeder completed successfully - 60 records generated (30 per user)');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});