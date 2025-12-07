import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { dataBalance, pivotPoints } = body;

    // Validate at least one field is provided
    if (dataBalance === undefined && pivotPoints === undefined) {
      return NextResponse.json(
        { 
          error: 'At least one field (dataBalance or pivotPoints) is required',
          code: 'MISSING_UPDATE_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate field types if provided
    if (dataBalance !== undefined && typeof dataBalance !== 'number') {
      return NextResponse.json(
        { 
          error: 'dataBalance must be a number',
          code: 'INVALID_DATA_BALANCE'
        },
        { status: 400 }
      );
    }

    if (pivotPoints !== undefined && (!Number.isInteger(pivotPoints) || typeof pivotPoints !== 'number')) {
      return NextResponse.json(
        { 
          error: 'pivotPoints must be an integer',
          code: 'INVALID_PIVOT_POINTS'
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (dataBalance !== undefined) {
      updateData.dataBalance = dataBalance;
    }

    if (pivotPoints !== undefined) {
      updateData.pivotPoints = pivotPoints;
    }

    // Update user
    const updatedUser = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to update user',
          code: 'UPDATE_FAILED'
        },
        { status: 500 }
      );
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser[0];

    return NextResponse.json(
      {
        success: true,
        message: 'Balance updated successfully',
        user: userWithoutPassword
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}