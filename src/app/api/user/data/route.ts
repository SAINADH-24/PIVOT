import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, dataTransfers, userNotifications } from '@/db/schema';
import { eq, or, desc, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch latest user data (balance, points)
    const userData = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch recent transfers
    const transfers = await db.query.dataTransfers.findMany({
      where: or(
        eq(dataTransfers.senderId, userId),
        eq(dataTransfers.receiverId, userId)
      ),
      orderBy: [desc(dataTransfers.createdAt)],
      limit: 20,
    });

    // Fetch unread notifications count
    const unreadCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userNotifications)
      .where(sql`${userNotifications.userId} = ${userId} AND ${userNotifications.read} = false`);
    
    const unreadCount = unreadCountResult[0]?.count || 0;

    return NextResponse.json({
      user: {
        dataBalance: userData.dataBalance,
        pivotPoints: userData.pivotPoints,
        name: userData.name,
        email: userData.email,
        udi: userData.udi,
      },
      transfers: transfers.map(t => ({
        ...t,
        type: t.senderId === userId ? 'sent' : 'received'
      })),
      unreadNotifications: unreadCount
    });

  } catch (error) {
    console.error('User data API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
