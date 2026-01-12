import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, dataTransfers, userNotifications } from '@/db/schema';
import { eq, or, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientIdentifier, amount, fee } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!recipientIdentifier) {
      return NextResponse.json({ error: 'Recipient identifier required (UDI, email, or phone)' }, { status: 400 });
    }

    const sender = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    if ((sender.dataBalance || 0) < amount) {
      return NextResponse.json({ error: 'Insufficient data balance' }, { status: 400 });
    }

    const pivotFee = fee || (amount * 10);
    if ((sender.pivotPoints || 0) < pivotFee) {
      return NextResponse.json({ error: 'Insufficient pivot points for fee' }, { status: 400 });
    }

    const cleanIdentifier = recipientIdentifier.trim();
    
    let receiver = await db.query.user.findFirst({
      where: eq(user.udi, cleanIdentifier),
    });

    if (!receiver) {
      receiver = await db.query.user.findFirst({
        where: eq(user.email, cleanIdentifier),
      });
    }

    if (!receiver) {
      receiver = await db.query.user.findFirst({
        where: eq(user.phoneNumber, cleanIdentifier),
      });
    }

    if (!receiver) {
      const cleanPhone = cleanIdentifier.replace(/[\s\-\(\)]/g, '');
      receiver = await db.query.user.findFirst({
        where: eq(user.phoneNumber, cleanPhone),
      });
    }

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found in P!VOT network. They must be a registered user.' }, { status: 404 });
    }

    if (receiver.id === sender.id) {
      return NextResponse.json({ error: 'Cannot send data to yourself' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const currentTimestamp = new Date();

    await db.update(user)
      .set({
        dataBalance: sql`${user.dataBalance} - ${amount}`,
        pivotPoints: sql`${user.pivotPoints} - ${pivotFee}`,
        updatedAt: currentTimestamp,
      })
      .where(eq(user.id, sender.id));

    await db.update(user)
      .set({
        dataBalance: sql`${user.dataBalance} + ${amount}`,
        updatedAt: currentTimestamp,
      })
      .where(eq(user.id, receiver.id));

    await db.insert(dataTransfers).values({
      senderId: sender.id,
      receiverId: receiver.id,
      amount: amount,
      fee: pivotFee,
      status: 'completed',
      createdAt: now,
    });

    await db.insert(userNotifications).values([
      {
        userId: sender.id,
        title: 'Data Sent Successfully',
        message: `You sent ${amount} GB to ${receiver.name} (${receiver.udi || receiver.email}).`,
        type: 'data_sent',
        createdAt: now,
      },
      {
        userId: receiver.id,
        title: 'Data Received!',
        message: `${sender.name} sent you ${amount} GB of data. Check your balance!`,
        type: 'data_received',
        createdAt: now,
      }
    ]);

    console.log(`[SMS MOCK] To Sender (${sender.phoneNumber || sender.email}): You sent ${amount} GB to ${receiver.name}. Your balance is now reduced.`);
    console.log(`[SMS MOCK] To Receiver (${receiver.phoneNumber || receiver.email}): ${sender.name} sent you ${amount} GB of data! Check your P!VOT account.`);

    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        amount,
        senderNewBalance: (sender.dataBalance || 0) - amount,
        receiverName: receiver.name,
        receiverUdi: receiver.udi
      }
    });

  } catch (error) {
    console.error('Transfer API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
