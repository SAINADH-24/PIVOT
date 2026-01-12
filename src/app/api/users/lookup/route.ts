import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    const cleanQuery = query.trim();

    let foundUser = await db.query.user.findFirst({
      where: eq(user.udi, cleanQuery),
    });

    if (!foundUser) {
      foundUser = await db.query.user.findFirst({
        where: eq(user.email, cleanQuery),
      });
    }

    if (!foundUser) {
      foundUser = await db.query.user.findFirst({
        where: eq(user.phoneNumber, cleanQuery),
      });
    }

    if (!foundUser) {
      const cleanPhone = cleanQuery.replace(/[\s\-\(\)]/g, '');
      foundUser = await db.query.user.findFirst({
        where: eq(user.phoneNumber, cleanPhone),
      });
    }

    if (!foundUser) {
      return NextResponse.json({ found: false, error: 'User not found' }, { status: 404 });
    }

    if (foundUser.id === session.user.id) {
      return NextResponse.json({ found: false, error: 'Cannot send to yourself' }, { status: 400 });
    }

    return NextResponse.json({
      found: true,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        udi: foundUser.udi,
        email: foundUser.email,
      }
    });

  } catch (error) {
    console.error('User lookup API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
