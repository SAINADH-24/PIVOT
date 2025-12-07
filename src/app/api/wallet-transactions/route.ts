import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { walletTransactions } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const VALID_TYPES = ['earned', 'spent', 'bonus'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const transaction = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.id, parseInt(id)))
        .limit(1);

      if (transaction.length === 0) {
        return NextResponse.json(
          { error: 'Wallet transaction not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(transaction[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const calculate = searchParams.get('calculate') === 'true';

    // Validate userId is provided for listing
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required for listing wallet transactions', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (type && !VALID_TYPES.includes(type as any)) {
      return NextResponse.json(
        { error: `Type must be one of: ${VALID_TYPES.join(', ')}`, code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Build where conditions
    const conditions = [eq(walletTransactions.userId, parseInt(userId))];
    
    if (type) {
      conditions.push(eq(walletTransactions.type, type));
    }

    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Fetch transactions
    const transactions = await db
      .select()
      .from(walletTransactions)
      .where(whereCondition)
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    // If calculate=true, return total points
    if (calculate) {
      const result = await db
        .select({
          totalPoints: sql<number>`COALESCE(SUM(${walletTransactions.amount}), 0)`
        })
        .from(walletTransactions)
        .where(whereCondition);

      return NextResponse.json({
        transactions,
        totalPoints: result[0]?.totalPoints || 0
      }, { status: 200 });
    }

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, amount, description } = body;

    // Validation: Required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'amount is required', code: 'MISSING_AMOUNT' },
        { status: 400 }
      );
    }

    if (!description || description.trim() === '') {
      return NextResponse.json(
        { error: 'description is required', code: 'MISSING_DESCRIPTION' },
        { status: 400 }
      );
    }

    // Validation: userId must be integer
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validation: type must be one of valid types
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${VALID_TYPES.join(', ')}`, code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Validation: amount must be integer
    if (!Number.isInteger(amount)) {
      return NextResponse.json(
        { error: 'amount must be an integer', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    // Validation: type-amount consistency checks
    if (type === 'spent' && amount > 0) {
      return NextResponse.json(
        { error: 'amount should typically be negative for type "spent"', code: 'AMOUNT_TYPE_MISMATCH' },
        { status: 400 }
      );
    }

    if ((type === 'earned' || type === 'bonus') && amount < 0) {
      return NextResponse.json(
        { error: `amount should typically be positive for type "${type}"`, code: 'AMOUNT_TYPE_MISMATCH' },
        { status: 400 }
      );
    }

    // Create wallet transaction
    const newTransaction = await db
      .insert(walletTransactions)
      .values({
        userId: parseInt(userId),
        type,
        amount: parseInt(amount),
        description: description.trim(),
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}