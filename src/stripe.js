// <reference types="stripe-event-types" />

import stripe from 'stripe';

class StripeService {
  constructor() {
    // Note: stripe cjs API types are faulty
    /** @type {import('stripe').Stripe} */
    // @ts-ignore
    this.client = stripe(process.env.STRIPE_SECRET_KEY);
  }

  /**
   * @param {string} userId
   * @param {string} successUrl
   * @param {string} failureUrl
   */
  async checkoutPayment(context, userId, amount, successUrl, failureUrl) {
    if (!amount || amount <= 0) {
      context.error(new Error("Invalid amount for checkout"));
      return null;
    }

    /** @type {import('stripe').Stripe.Checkout.SessionCreateParams.LineItem} */
    const lineItem = {
      price_data: {
        unit_amount: Math.round(amount), // Dynamically set the amount (ensure it's in cents)
        currency: 'usd',
        product_data: {
          name: 'Product',
          
        },
      },
      quantity: 1,
    };

    
    // const lineItem = {
    //   price_data: {
    //   unit_amount:1000, // Stripe expects amount in cents
    //   currency: 'usd',
    //   product_data: {
    //     name: productName, // Dynamically use product name
    //   },
    // },
    //   quantity: 1,
    // };

    try {
      return await this.client.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [lineItem],
        success_url: successUrl,
        cancel_url: failureUrl,
        client_reference_id: userId,
        metadata: {
          userId,
          
        },
        mode: 'payment',
      });
      console.log("Checkout session created:", session);  // Log the session details for debugging

    return session;  // Return session URL to frontend for redirection
    } catch (err) {
      context.error(err);
      return null;
    }
  }

  /**
   * @returns {import("stripe").Stripe.DiscriminatedEvent | null}
   */
  validateWebhook(context, req) {
    try {
      const event = this.client.webhooks.constructEvent(
        req.bodyBinary,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return /** @type {import("stripe").Stripe.DiscriminatedEvent} */ (event);
    } catch (err) {
      context.error(err);
      return null;
    }
  }
}

export default StripeService;
