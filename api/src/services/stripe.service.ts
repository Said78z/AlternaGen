import Stripe from 'stripe';

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

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            // Handle successful subscription
            console.log('Subscription created:', session.client_reference_id);
            break;

        case 'customer.subscription.deleted':
            const subscription = event.data.object as Stripe.Subscription;
            // Handle subscription cancellation
            console.log('Subscription cancelled:', subscription.metadata?.userId);
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
    await stripe.subscriptions.cancel(subscriptionId);
}
