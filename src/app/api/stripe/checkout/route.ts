import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_TEST_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const POINTS_PACKAGES = [
  { id: 1, points: 100, price: 49, bonus: 0, label: 'Starter' },
  { id: 2, points: 500, price: 199, bonus: 25, label: 'Basic' },
  { id: 3, points: 1000, price: 349, bonus: 100, label: 'Popular' },
  { id: 4, points: 2500, price: 749, bonus: 375, label: 'Value' },
  { id: 5, points: 5000, price: 1299, bonus: 1000, label: 'Pro' },
  { id: 6, points: 10000, price: 2299, bonus: 2500, label: 'Ultimate' },
];

const DATA_PLANS = [
  { id: 'weekend-power-pack', title: 'Weekend Power Pack', data: 5, validity: '3 days', price: 199, points: 50 },
  { id: 'monthly-unlimited', title: 'Monthly Unlimited', data: 50, validity: '28 days', price: 599, points: 200 },
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packageId, planId } = body;
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    if (planId) {
      const plan = DATA_PLANS.find(p => p.id === planId);
      if (!plan) {
        return NextResponse.json(
          { error: 'Invalid plan' },
          { status: 400 }
        );
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: plan.title,
                description: `${plan.data} GB data valid for ${plan.validity} + ${plan.points} Pivot Points`,
              },
              unit_amount: plan.price * 100,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: session.user.id,
          type: 'data_plan',
          planId: plan.id,
          planTitle: plan.title,
          dataGb: plan.data.toString(),
          validity: plan.validity,
          bonusPoints: plan.points.toString(),
          priceInr: plan.price.toString(),
        },
        success_url: `${origin}/wallet/success?session_id={CHECKOUT_SESSION_ID}&type=plan`,
        cancel_url: `${origin}/?page=dashboard`,
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID or Plan ID is required' },
        { status: 400 }
      );
    }

    const pkg = POINTS_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json(
        { error: 'Invalid package' },
        { status: 400 }
      );
    }

    const totalPoints = pkg.points + pkg.bonus;

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `${pkg.label} - ${totalPoints} Pivot Points`,
              description: pkg.bonus > 0 
                ? `${pkg.points} points + ${pkg.bonus} bonus points`
                : `${pkg.points} Pivot Points`,
            },
            unit_amount: pkg.price * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        type: 'points_package',
        packageId: pkg.id.toString(),
        points: pkg.points.toString(),
        bonusPoints: pkg.bonus.toString(),
        totalPoints: totalPoints.toString(),
        priceInr: pkg.price.toString(),
        packageLabel: pkg.label,
      },
      success_url: `${origin}/wallet/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?page=wallet`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
