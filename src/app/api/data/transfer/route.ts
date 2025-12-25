import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions, notifications } from '@/db/schema';
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
    const { recipientPhone, recipientUdi, amount, network, fee } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!recipientPhone && !recipientUdi) {
      return NextResponse.json({ error: 'Recipient identifier required' }, { status: 400 });
    }

    // 1. Find Sender
    const sender = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    if (sender.dataBalance < amount) {
      return NextResponse.json({ error: 'Insufficient data balance' }, { status: 400 });
    }

    if (sender.pivotPoints < fee) {
      return NextResponse.json({ error: 'Insufficient pivot points for fee' }, { status: 400 });
    }

    // 2. Find Receiver
    let receiver;
    if (recipientPhone) {
      // Try finding by phone (normalize by removing spaces/dashes)
      const cleanPhone = recipientPhone.replace(/[\s\-\(\)]/g, '');
      receiver = await db.query.users.findFirst({
        where: eq(users.phone, cleanPhone),
      });
      
      // Fallback: try original phone string
      if (!receiver) {
        receiver = await db.query.users.findFirst({
          where: eq(users.phone, recipientPhone),
        });
      }
    }

    if (!receiver && recipientUdi) {
      receiver = await db.query.users.findFirst({
        where: eq(users.udi, recipientUdi),
      });
    }

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found in P!VOT network' }, { status: 404 });
    }

    if (receiver.id === sender.id) {
      return NextResponse.json({ error: 'Cannot send data to yourself' }, { status: 400 });
    }

    // 3. Perform atomic transfer
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      // Update Sender
      await tx.update(users)
        .set({
          dataBalance: sql`${users.dataBalance} - ${amount}`,
          pivotPoints: sql`${users.pivotPoints} - ${fee}`,
          updatedAt: now,
        })
        .where(eq(users.id, sender.id));

      // Update Receiver
      await tx.update(users)
        .set({
          dataBalance: sql`${users.dataBalance} + ${amount}`,
          updatedAt: now,
        })
        .where(eq(users.id, receiver.id));

      // Add Transaction records
      await tx.insert(transactions).values([
        {
          userId: sender.id,
          type: 'Data Transfer - Sent',
          amount: amount,
          recipientPhone: receiver.phone,
          recipientUdi: receiver.udi,
          network: network,
          fee: fee,
          status: 'completed',
          createdAt: now,
        },
        {
          userId: receiver.id,
          type: 'Data Transfer - Received',
          amount: amount,
          recipientPhone: sender.phone,
          recipientUdi: sender.udi,
          network: network,
          fee: 0,
          status: 'completed',
          createdAt: now,
        }
      ]);

      // Add Notifications
      await tx.insert(notifications).values([
        {
          userId: sender.id,
          title: 'Data Sent Successfully',
          message: `You have successfully sent ${amount} GB to ${receiver.name} (${receiver.phone}).`,
          type: 'data_sent',
          createdAt: now,
        },
        {
          userId: receiver.id,
          title: 'Data Received!',
          message: `${sender.name} (${sender.phone}) has sent you ${amount} GB of data.`,
          type: 'data_received',
          createdAt: now,
        }
      ]);
    });

    // 4. Mock SMS Notifications
    console.log(`[SMS MOCK] To Sender (${sender.phone}): You have successfully sent ${amount} GB to ${receiver.phone}. Your balance has been reduced.`);
    console.log(`[SMS MOCK] To Receiver (${receiver.phone}): ${sender.name} has sent you ${amount} GB of data successfully! Check your P!VOT account.`);

    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        amount,
        senderBalance: sender.dataBalance - amount,
        receiverName: receiver.name
      }
    });

  } catch (error) {
    console.error('Transfer API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
