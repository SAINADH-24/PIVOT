import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, users } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const VALID_TYPES = ['transfer', 'recharge'] as const;
const VALID_STATUSES = ['completed', 'pending', 'failed'] as const;
const VALID_NETWORKS = ['Airtel', 'Jio', 'Vi', 'BSNL'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single transaction by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const transaction = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, parseInt(id)))
        .limit(1);

      if (transaction.length === 0) {
        return NextResponse.json(
          { error: 'Transaction not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(transaction[0], { status: 200 });
    }

    // List transactions with filtering and pagination
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build query conditions
    const conditions = [];

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(transactions.userId, parseInt(userId)));
    }

    if (type) {
      if (!VALID_TYPES.includes(type as any)) {
        return NextResponse.json(
          { 
            error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
            code: 'INVALID_TYPE' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(transactions.type, type));
    }

    let query = db.select().from(transactions);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
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
    const { userId, type, amount, recipientPhone, recipientUdi, network, fee, cost, validity, status } = body;

    // Validate required fields
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type as any)) {
      return NextResponse.json(
        { 
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
          code: 'INVALID_TYPE' 
        },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Amount is required', code: 'MISSING_AMOUNT' },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    if (fee === undefined || fee === null) {
      return NextResponse.json(
        { error: 'Fee is required', code: 'MISSING_FEE' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(fee)) || parseInt(fee) < 0) {
      return NextResponse.json(
        { error: 'Fee must be a non-negative number', code: 'INVALID_FEE' },
        { status: 400 }
      );
    }

    // Validate user exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Type-specific validation
    if (type === 'transfer') {
      if (!recipientPhone && !recipientUdi) {
        return NextResponse.json(
          { 
            error: 'Either recipientPhone or recipientUdi is required for transfer',
            code: 'MISSING_RECIPIENT' 
          },
          { status: 400 }
        );
      }
    }

    if (type === 'recharge') {
      if (!network) {
        return NextResponse.json(
          { error: 'Network is required for recharge', code: 'MISSING_NETWORK' },
          { status: 400 }
        );
      }

      if (!VALID_NETWORKS.includes(network as any)) {
        return NextResponse.json(
          { 
            error: `Invalid network. Must be one of: ${VALID_NETWORKS.join(', ')}`,
            code: 'INVALID_NETWORK' 
          },
          { status: 400 }
        );
      }

      if (!cost || isNaN(parseInt(cost))) {
        return NextResponse.json(
          { error: 'Valid cost is required for recharge', code: 'MISSING_COST' },
          { status: 400 }
        );
      }

      if (!validity || isNaN(parseInt(validity))) {
        return NextResponse.json(
          { error: 'Valid validity is required for recharge', code: 'MISSING_VALIDITY' },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status as any)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Prepare transaction data
    const transactionData: any = {
      userId: parseInt(userId),
      type,
      amount: parseFloat(amount),
      fee: parseInt(fee),
      status: status || 'completed',
      createdAt: new Date().toISOString(),
    };

    // Add type-specific fields
    if (type === 'transfer') {
      if (recipientPhone) transactionData.recipientPhone = recipientPhone.trim();
      if (recipientUdi) transactionData.recipientUdi = recipientUdi.trim();
    }

    if (type === 'recharge') {
      transactionData.network = network;
      transactionData.cost = parseInt(cost);
      transactionData.validity = parseInt(validity);
    }

    const newTransaction = await db
      .insert(transactions)
      .values(transactionData)
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