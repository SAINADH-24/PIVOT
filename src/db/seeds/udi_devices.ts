import { db } from '@/db';
import { udiDevices } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const sampleDevices = [
        // User 1 (sainadh@pivot.com, userId: 1) devices
        {
            userId: 1,
            name: 'iPhone 15 Pro',
            type: 'phone',
            status: 'active',
            phoneNumber: '+12345678901',
            udiId: '@sainadh-iphone',
            dataUsed: 12.5,
            lastConnected: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 1,
            name: 'MacBook Pro',
            type: 'laptop',
            status: 'active',
            phoneNumber: '+12345678902',
            udiId: '@sainadh-macbook',
            dataUsed: 45.8,
            lastConnected: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 1,
            name: 'iPad Air',
            type: 'tablet',
            status: 'inactive',
            phoneNumber: '+12345678903',
            udiId: '@sainadh-ipad',
            dataUsed: 8.2,
            lastConnected: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        // User 2 (priya@pivot.com, userId: 2) devices
        {
            userId: 2,
            name: 'Galaxy S24 Ultra',
            type: 'phone',
            status: 'active',
            phoneNumber: '+19876543211',
            udiId: '@priya-galaxy',
            dataUsed: 18.7,
            lastConnected: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
            createdAt: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        },
        {
            userId: 2,
            name: 'Dell XPS 15',
            type: 'laptop',
            status: 'active',
            phoneNumber: '+19876543212',
            udiId: '@priya-dell',
            dataUsed: 62.4,
            lastConnected: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: 2,
            name: 'Samsung Tab S9',
            type: 'tablet',
            status: 'active',
            phoneNumber: '+19876543213',
            udiId: '@priya-tab',
            dataUsed: 14.3,
            lastConnected: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    await db.insert(udiDevices).values(sampleDevices);
    
    console.log('✅ UDI devices seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});