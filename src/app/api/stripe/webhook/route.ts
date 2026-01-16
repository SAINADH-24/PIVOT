import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/db';
import { user, pivotPointTransactions } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_TEST_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const metadata = session.metadata;
    if (!metadata) {
      console.error('No metadata in session');
      return NextResponse.json({ error: 'No metadata' }, { status: 400 });
    }

    const userId = metadata.userId;
    const purchaseType = metadata.type || 'points_package';
    const priceInr = parseInt(metadata.priceInr || '0', 10);

    if (!userId) {
      console.error('Invalid metadata - missing userId:', metadata);
      return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
    }

    try {
      if (purchaseType === 'data_plan') {
        const dataGb = parseFloat(metadata.dataGb || '0');
        const bonusPoints = parseInt(metadata.bonusPoints || '0', 10);
        const planTitle = metadata.planTitle || '';
        const validity = metadata.validity || '';

        await db
          .update(user)
          .set({
            dataBalance: sql`${user.dataBalance} + ${dataGb}`,
            pivotPoints: sql`${user.pivotPoints} + ${bonusPoints}`,
            updatedAt: new Date(),
          })
          .where(eq(user.id, userId));

        await db.insert(pivotPointTransactions).values({
          userId,
          type: 'plan_purchase',
          amount: bonusPoints,
          priceInr,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string,
          packageLabel: planTitle,
          bonusPoints: 0,
          description: `Activated ${planTitle}: ${dataGb} GB (${validity}) + ${bonusPoints} PP bonus`,
          status: 'completed',
          createdAt: new Date().toISOString(),
        });

        console.log(`Successfully credited ${dataGb} GB and ${bonusPoints} points to user ${userId}`);
      } else {
        const totalPoints = parseInt(metadata.totalPoints || '0', 10);
        const points = parseInt(metadata.points || '0', 10);
        const bonusPoints = parseInt(metadata.bonusPoints || '0', 10);
        const packageLabel = metadata.packageLabel || '';

        if (totalPoints <= 0) {
          console.error('Invalid points metadata:', metadata);
          return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
        }

        await db
          .update(user)
          .set({
            pivotPoints: sql`${user.pivotPoints} + ${totalPoints}`,
            updatedAt: new Date(),
          })
          .where(eq(user.id, userId));

        await db.insert(pivotPointTransactions).values({
          userId,
          type: 'purchase',
          amount: totalPoints,
          priceInr,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string,
          packageLabel,
          bonusPoints,
          description: `Purchased ${packageLabel} package: ${points} points${bonusPoints > 0 ? ` + ${bonusPoints} bonus` : ''}`,
          status: 'completed',
          createdAt: new Date().toISOString(),
        });

        console.log(`Successfully credited ${totalPoints} points to user ${userId}`);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
