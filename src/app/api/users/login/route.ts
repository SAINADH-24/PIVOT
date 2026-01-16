import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone number and password are required' },
        { status: 400 }
      );
    }

    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

    const userResult = await db.select()
      .from(user)
      .where(eq(user.phoneNumber, normalizedPhone))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'No account found with this phone number' },
        { status: 401 }
      );
    }

    const foundUser = userResult[0];

    return NextResponse.json({
      success: true,
      email: foundUser.email,
    });

  } catch (error) {
    console.error('POST /api/users/login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}