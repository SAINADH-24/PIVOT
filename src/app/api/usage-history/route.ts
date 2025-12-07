import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { usageHistory, users } from '@/db/schema';
import { eq, desc, gte, sql, and } from 'drizzle-orm';

const VALID_CATEGORIES = ['Streaming', 'Social', 'Work', 'Gaming'] as const;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') ?? '30');
    const calculate = searchParams.get('calculate') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT)), MAX_LIMIT);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(usageHistory)
        .where(eq(usageHistory.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'Usage history not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List usage history with filters
    if (!userId) {
      return NextResponse.json({ 
        error: "userId parameter is required for listing usage history",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(userId))) {
      return NextResponse.json({ 
        error: "Valid userId is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    // Calculate date threshold for filtering
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateThresholdStr = dateThreshold.toISOString().split('T')[0];

    // Build query with filters
    const records = await db.select()
      .from(usageHistory)
      .where(
        and(
          eq(usageHistory.userId, parseInt(userId)),
          gte(usageHistory.date, dateThresholdStr)
        )
      )
      .orderBy(desc(usageHistory.date))
      .limit(limit)
      .offset(offset);

    // If calculation is requested, compute average daily usage
    if (calculate) {
      const statsQuery = await db.select({
        totalGb: sql<number>`COALESCE(SUM(${usageHistory.gbUsed}), 0)`,
        distinctDays: sql<number>`COUNT(DISTINCT ${usageHistory.date})`
      })
      .from(usageHistory)
      .where(
        and(
          eq(usageHistory.userId, parseInt(userId)),
          gte(usageHistory.date, dateThresholdStr)
        )
      );

      const totalGb = Number(statsQuery[0]?.totalGb || 0);
      const distinctDays = Number(statsQuery[0]?.distinctDays || 1);
      const averageDailyUsage = distinctDays > 0 ? totalGb / distinctDays : 0;

      return NextResponse.json({
        usageHistory: records,
        averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
        totalDays: distinctDays
      }, { status: 200 });
    }

    return NextResponse.json(records, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const records = Array.isArray(body) ? body : [body];

    if (records.length === 0) {
      return NextResponse.json({ 
        error: "At least one usage history record is required",
        code: "EMPTY_ARRAY" 
      }, { status: 400 });
    }

    // Validate all records
    const validatedRecords = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const errors: string[] = [];

      // Required field validation
      if (!record.userId) {
        errors.push(`Record ${i}: userId is required`);
      } else if (typeof record.userId !== 'number' || record.userId <= 0) {
        errors.push(`Record ${i}: userId must be a positive number`);
      }

      if (!record.date) {
        errors.push(`Record ${i}: date is required`);
      } else {
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(record.date)) {
          errors.push(`Record ${i}: date must be in YYYY-MM-DD format`);
        }
      }

      if (record.gbUsed === undefined || record.gbUsed === null) {
        errors.push(`Record ${i}: gbUsed is required`);
      } else if (typeof record.gbUsed !== 'number' || record.gbUsed < 0) {
        errors.push(`Record ${i}: gbUsed must be a non-negative number`);
      }

      if (!record.primaryCategory) {
        errors.push(`Record ${i}: primaryCategory is required`);
      } else if (!VALID_CATEGORIES.includes(record.primaryCategory as any)) {
        errors.push(`Record ${i}: primaryCategory must be one of: ${VALID_CATEGORIES.join(', ')}`);
      }

      if (errors.length > 0) {
        return NextResponse.json({ 
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors
        }, { status: 400 });
      }

      // Verify user exists
      const userExists = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, record.userId))
        .limit(1);

      if (userExists.length === 0) {
        return NextResponse.json({ 
          error: `Record ${i}: User with id ${record.userId} does not exist`,
          code: "USER_NOT_FOUND" 
        }, { status: 400 });
      }

      validatedRecords.push({
        userId: record.userId,
        date: record.date,
        gbUsed: record.gbUsed,
        primaryCategory: record.primaryCategory,
        createdAt: new Date().toISOString()
      });
    }

    // Insert all validated records
    const created = await db.insert(usageHistory)
      .values(validatedRecords)
      .returning();

    return NextResponse.json(
      Array.isArray(body) ? created : created[0], 
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}