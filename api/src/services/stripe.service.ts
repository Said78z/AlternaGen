import Stripe from 'stripe';
import { prisma } from '../utils/database';
import logger from '../utils/logger';
import metrics from '../utils/metrics';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
});

export interface CreateCheckoutSessionParams {
    userId: string;
    userEmail: string;
    successUrl: string;
    cancelUrl: string;
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
    const session = await stripe.checkout.sessions.create({
        customer_email: params.userEmail,
        client_reference_id: params.userId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
            {
                price: process.env.STRIPE_PRICE_ID!,
                quantity: 1,
            },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
            userId: params.userId,
        },
    });

    return session.url!;
}


export async function handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Idempotency Check
    const existingEvent = await prisma.stripeWebhookEvent.findUnique({
        where: { eventId: event.id }
    });
    if (existingEvent) return; // Already processed

    await prisma.stripeWebhookEvent.create({
        data: { eventId: event.id, type: event.type }
    });

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.client_reference_id;
            const subscriptionId = session.subscription as string;

            if (userId && subscriptionId) {
                // Fetch subscription details to get current_period_end
                const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

                await prisma.subscription.upsert({
                    where: { userId },
                    create: {
                        userId,
                        stripeSubscriptionId: subscriptionId,
                        stripeCustomerId: session.customer as string,
                        planCode: 'PRO', // Assuming only PRO is sold via this flow for now
                        status: stripeSub.status,
                        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000)
                    },
                    update: {
                        stripeSubscriptionId: subscriptionId,
                        stripeCustomerId: session.customer as string,
                        planCode: 'PRO',
                        status: stripeSub.status,
                        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000)
                    }
                });
                console.log(`[Stripe] Subscription created/updated for user ${userId}`);
            }
            break;
        }

        case 'customer.subscription.updated': {
            const sub = event.data.object as Stripe.Subscription;
            await prisma.subscription.update({
                where: { stripeSubscriptionId: sub.id },
                data: {
                    status: sub.status,
                    currentPeriodEnd: new Date(sub.current_period_end * 1000)
                }
            });
            break;
        }

        case 'customer.subscription.deleted': {
            const sub = event.data.object as Stripe.Subscription;
            await prisma.subscription.update({
                where: { stripeSubscriptionId: sub.id },
                data: {
                    status: 'canceled',
                }
            });
            console.log(`[Stripe] Subscription canceled for subs ${sub.id}`);
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    metrics.increment('webhook_success_total');
    logger.info({ eventId: event.id, type: event.type }, 'Webhook processed successfully');
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
    await stripe.subscriptions.cancel(subscriptionId);
}
