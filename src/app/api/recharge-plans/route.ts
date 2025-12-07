import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rechargePlans, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const plan = await db.select()
        .from(rechargePlans)
        .where(eq(rechargePlans.id, parseInt(id)))
        .limit(1);

      if (plan.length === 0) {
        return NextResponse.json({ 
          error: 'Recharge plan not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(plan[0], { status: 200 });
    }

    // List recharge plans with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select().from(rechargePlans);

    // Build where conditions
    const conditions = [];

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json({ 
          error: "Valid userId is required",
          code: "INVALID_USER_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(rechargePlans.userId, parseInt(userId)));
    }

    if (status) {
      if (!['active', 'expired'].includes(status)) {
        return NextResponse.json({ 
          error: "Status must be 'active' or 'expired'",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      conditions.push(eq(rechargePlans.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const plans = await query
      .orderBy(desc(rechargePlans.activatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(plans, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      validity, 
      dataAmount, 
      dataMode, 
      totalCost, 
      pivotPointsEarned,
      voiceCalls,
      unlimitedVoice,
      ottPlatforms,
      status
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!validity || isNaN(parseInt(validity)) || parseInt(validity) <= 0) {
      return NextResponse.json({ 
        error: "validity is required and must be greater than 0",
        code: "INVALID_VALIDITY" 
      }, { status: 400 });
    }

    if (!dataAmount || isNaN(parseInt(dataAmount)) || parseInt(dataAmount) <= 0) {
      return NextResponse.json({ 
        error: "dataAmount is required and must be greater than 0",
        code: "INVALID_DATA_AMOUNT" 
      }, { status: 400 });
    }

    if (!dataMode) {
      return NextResponse.json({ 
        error: "dataMode is required",
        code: "MISSING_DATA_MODE" 
      }, { status: 400 });
    }

    if (!['4g', '5g'].includes(dataMode)) {
      return NextResponse.json({ 
        error: "dataMode must be '4g' or '5g'",
        code: "INVALID_DATA_MODE" 
      }, { status: 400 });
    }

    if (!totalCost || isNaN(parseInt(totalCost)) || parseInt(totalCost) <= 0) {
      return NextResponse.json({ 
        error: "totalCost is required and must be greater than 0",
        code: "INVALID_TOTAL_COST" 
      }, { status: 400 });
    }

    if (pivotPointsEarned === undefined || pivotPointsEarned === null || isNaN(parseInt(pivotPointsEarned))) {
      return NextResponse.json({ 
        error: "pivotPointsEarned is required",
        code: "MISSING_PIVOT_POINTS" 
      }, { status: 400 });
    }

    // Verify user exists
    const user = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND" 
      }, { status: 404 });
    }

    // Calculate timestamps
    const activatedAt = new Date().toISOString();
    const expiresAtDate = new Date();
    expiresAtDate.setDate(expiresAtDate.getDate() + parseInt(validity));
    const expiresAt = expiresAtDate.toISOString();
    const createdAt = new Date().toISOString();

    // Prepare insert data
    const insertData: any = {
      userId: parseInt(userId),
      validity: parseInt(validity),
      dataAmount: parseInt(dataAmount),
      dataMode: dataMode.trim(),
      voiceCalls: voiceCalls ?? false,
      unlimitedVoice: unlimitedVoice ?? false,
      totalCost: parseInt(totalCost),
      pivotPointsEarned: parseInt(pivotPointsEarned),
      status: status && ['active', 'expired'].includes(status) ? status : 'active',
      activatedAt,
      expiresAt,
      createdAt
    };

    // Handle ottPlatforms
    if (ottPlatforms !== undefined) {
      if (Array.isArray(ottPlatforms)) {
        insertData.ottPlatforms = JSON.stringify(ottPlatforms);
      } else if (typeof ottPlatforms === 'string') {
        try {
          JSON.parse(ottPlatforms);
          insertData.ottPlatforms = ottPlatforms;
        } catch {
          return NextResponse.json({ 
            error: "ottPlatforms must be a valid JSON array",
            code: "INVALID_OTT_PLATFORMS" 
          }, { status: 400 });
        }
      } else {
        return NextResponse.json({ 
          error: "ottPlatforms must be an array or valid JSON string",
          code: "INVALID_OTT_PLATFORMS" 
        }, { status: 400 });
      }
    }

    const newPlan = await db.insert(rechargePlans)
      .values(insertData)
      .returning();

    return NextResponse.json(newPlan[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if plan exists
    const existingPlan = await db.select()
      .from(rechargePlans)
      .where(eq(rechargePlans.id, parseInt(id)))
      .limit(1);

    if (existingPlan.length === 0) {
      return NextResponse.json({ 
        error: 'Recharge plan not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status if provided
    if (status && !['active', 'expired'].includes(status)) {
      return NextResponse.json({ 
        error: "Status must be 'active' or 'expired'",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    const updates: any = {};

    if (status) {
      updates.status = status;
    }

    // If no valid updates provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    const updatedPlan = await db.update(rechargePlans)
      .set(updates)
      .where(eq(rechargePlans.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedPlan[0], { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}