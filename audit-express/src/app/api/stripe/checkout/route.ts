import { NextRequest, NextResponse } from 'next/server';

// Stub endpoint - Stripe integration placeholder
export async function POST(_req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeKey) {
    return NextResponse.json(
      { stub: true, message: 'Stripe not configured. Set STRIPE_SECRET_KEY to enable payments.' },
      { status: 200 }
    );
  }
  
  // TODO: Implement Stripe checkout session creation
  return NextResponse.json({ stub: true, checkoutUrl: '/stub-checkout' });
}
