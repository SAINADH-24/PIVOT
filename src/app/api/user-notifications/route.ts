import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userNotifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let notifications;
    
    if (unreadOnly) {
      notifications = await db.query.userNotifications.findMany({
        where: and(
          eq(userNotifications.userId, session.user.id),
          eq(userNotifications.read, false)
        ),
        orderBy: [desc(userNotifications.createdAt)],
        limit: 20,
      });
    } else {
      notifications = await db.query.userNotifications.findMany({
        where: eq(userNotifications.userId, session.user.id),
        orderBy: [desc(userNotifications.createdAt)],
        limit: 50,
      });
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Notifications API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await db.update(userNotifications)
        .set({ read: true })
        .where(eq(userNotifications.userId, session.user.id));
      
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    await db.update(userNotifications)
      .set({ read: true })
      .where(and(
        eq(userNotifications.id, notificationId),
        eq(userNotifications.userId, session.user.id)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
