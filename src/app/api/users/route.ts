import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, and, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Helper function to exclude password from user object
function excludePassword(user: any) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single user fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(excludePassword(user[0]), { status: 200 });
    }

    // List users with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(users);

    if (search) {
      query = query.where(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.phone, `%${search}%`),
          like(users.udi, `%${search}%`)
        )
      );
    }

    const results = await query.limit(limit).offset(offset);
    
    // Remove password from all results
    const sanitizedResults = results.map(excludePassword);

    return NextResponse.json(sanitizedResults, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, udi, twoFactorEnabled, twoFactorMethod } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: 'Phone is required', code: 'MISSING_PHONE' },
        { status: 400 }
      );
    }

    if (!password || !password.trim()) {
      return NextResponse.json(
        { error: 'Password is required', code: 'MISSING_PASSWORD' },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingUserByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingUserByEmail.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'EMAIL_EXISTS' },
        { status: 400 }
      );
    }

    // Check UDI uniqueness if provided
    if (udi) {
      const existingUserByUdi = await db
        .select()
        .from(users)
        .where(eq(users.udi, udi.trim()))
        .limit(1);

      if (existingUserByUdi.length > 0) {
        return NextResponse.json(
          { error: 'UDI already exists', code: 'UDI_EXISTS' },
          { status: 400 }
        );
      }
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare insert data
    const timestamp = new Date().toISOString();
    const insertData: any = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      dataBalance: 15.5,
      pivotPoints: 1250,
      twoFactorEnabled: twoFactorEnabled ?? false,
      twoFactorMethod: twoFactorMethod?.trim() || 'sms',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (udi) {
      insertData.udi = udi.trim();
    }

    // Insert user
    const newUser = await db.insert(users).values(insertData).returning();

    return NextResponse.json(excludePassword(newUser[0]), { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      udi,
      twoFactorEnabled,
      twoFactorMethod,
      dataBalance,
      pivotPoints,
    } = body;

    // Prepare update data
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and add fields to update
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json(
          { error: 'Email cannot be empty', code: 'INVALID_EMAIL' },
          { status: 400 }
        );
      }

      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' },
          { status: 400 }
        );
      }

      // Check email uniqueness (excluding current user)
      const existingUserByEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);

      if (
        existingUserByEmail.length > 0 &&
        existingUserByEmail[0].id !== parseInt(id)
      ) {
        return NextResponse.json(
          { error: 'Email already exists', code: 'EMAIL_EXISTS' },
          { status: 400 }
        );
      }

      updates.email = email.toLowerCase().trim();
    }

    if (phone !== undefined) {
      if (!phone.trim()) {
        return NextResponse.json(
          { error: 'Phone cannot be empty', code: 'INVALID_PHONE' },
          { status: 400 }
        );
      }
      updates.phone = phone.trim();
    }

    if (udi !== undefined) {
      if (udi && udi.trim()) {
        // Check UDI uniqueness (excluding current user)
        const existingUserByUdi = await db
          .select()
          .from(users)
          .where(eq(users.udi, udi.trim()))
          .limit(1);

        if (
          existingUserByUdi.length > 0 &&
          existingUserByUdi[0].id !== parseInt(id)
        ) {
          return NextResponse.json(
            { error: 'UDI already exists', code: 'UDI_EXISTS' },
            { status: 400 }
          );
        }
        updates.udi = udi.trim();
      } else {
        updates.udi = null;
      }
    }

    if (twoFactorEnabled !== undefined) {
      updates.twoFactorEnabled = twoFactorEnabled;
    }

    if (twoFactorMethod !== undefined) {
      if (!twoFactorMethod.trim()) {
        return NextResponse.json(
          { error: 'Two factor method cannot be empty', code: 'INVALID_TWO_FACTOR_METHOD' },
          { status: 400 }
        );
      }
      updates.twoFactorMethod = twoFactorMethod.trim();
    }

    if (dataBalance !== undefined) {
      if (typeof dataBalance !== 'number' || dataBalance < 0) {
        return NextResponse.json(
          { error: 'Data balance must be a positive number', code: 'INVALID_DATA_BALANCE' },
          { status: 400 }
        );
      }
      updates.dataBalance = dataBalance;
    }

    if (pivotPoints !== undefined) {
      if (typeof pivotPoints !== 'number' || pivotPoints < 0 || !Number.isInteger(pivotPoints)) {
        return NextResponse.json(
          { error: 'Pivot points must be a positive integer', code: 'INVALID_PIVOT_POINTS' },
          { status: 400 }
        );
      }
      updates.pivotPoints = pivotPoints;
    }

    // Update user
    const updated = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, parseInt(id)))
      .returning();

    return NextResponse.json(excludePassword(updated[0]), { status: 200 });
  } catch (error: any) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete user
    const deleted = await db
      .delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'User deleted successfully',
        user: excludePassword(deleted[0]),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}