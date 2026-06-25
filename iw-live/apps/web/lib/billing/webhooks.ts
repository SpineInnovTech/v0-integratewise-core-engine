// Billing Webhook Handlers
// Supports payment provider webhooks with signature verification

import { createHmac, timingSafeEqual } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import type { WebhookEvent } from './types';

interface WebhookConfig {
  secret: string;
  signatureHeader: string;
  timestampHeader?: string;
  toleranceSeconds?: number;
}

export class WebhookVerifier {
  /**
   * Verify webhook signature using HMAC
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp?: number
  ): boolean {
    try {
      // Check replay window (±5 minutes by default)
      if (timestamp) {
        const now = Math.floor(Date.now() / 1000);
        const tolerance = 300; // 5 minutes
        if (Math.abs(now - timestamp) > tolerance) {
          console.warn('Webhook timestamp outside tolerance window');
          return false;
        }
      }

      // Compute HMAC signature
      const hmac = createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      // Timing-safe comparison
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const receivedBuffer = Buffer.from(signature, 'hex');

      if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
      }

      return timingSafeEqual(expectedBuffer, receivedBuffer);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Verify Razorpay webhook signature
   */
  static verifyRazorpay(payload: string, signature: string, secret: string): boolean {
    return this.verifySignature(payload, signature, secret);
  }

  /**
   * Verify Stripe webhook signature
   */
  static verifyStripe(payload: string, signature: string, secret: string, timestamp: number): boolean {
    const signedPayload = `${timestamp}.${payload}`;
    return this.verifySignature(signedPayload, signature, secret, timestamp);
  }
}

export class WebhookProcessor {
  /**
   * Process payment success webhook
   */
  static async processPaymentSuccess(event: WebhookEvent): Promise<void> {
    const supabase = await createClient();
    const { provider, data } = event;

    // Extract payment details based on provider
    const paymentId = data.payment_id || data.id;
    const invoiceId = data.invoice_id;
    const amountCents = data.amount || data.amount_cents;
    const currency = data.currency || 'INR';

    if (!paymentId || !invoiceId) {
      throw new Error('Missing required payment data');
    }

    // Check if payment already processed (idempotency)
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('provider', provider)
      .eq('provider_payment_id', paymentId)
      .single();

    if (existingPayment) {
      console.log(`Payment ${paymentId} already processed, skipping`);
      return;
    }

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        provider,
        provider_payment_id: paymentId,
        amount_cents: amountCents,
        currency,
        status: 'succeeded',
        metadata: data,
      });

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      throw new Error('Failed to create payment record');
    }

    // Update invoice status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      throw new Error('Failed to update invoice');
    }

    // Update subscription status if needed
    if (invoice.subscription_id) {
      const { data: subscription } = await supabase
        .from('org_subscriptions')
        .select('*')
        .eq('id', invoice.subscription_id)
        .single();

      if (subscription && subscription.status === 'past_due') {
        await supabase
          .from('org_subscriptions')
          .update({ status: 'active' })
          .eq('id', invoice.subscription_id);
      }
    }

    // Create audit log
    await supabase.from('billing_audit_log').insert({
      org_id: invoice.org_id,
      event_type: 'payment_success',
      metadata: { payment_id: paymentId, invoice_id: invoiceId, amount_cents: amountCents },
    });

    console.log(`Payment ${paymentId} processed successfully`);
  }

  /**
   * Process payment failure webhook
   */
  static async processPaymentFailure(event: WebhookEvent): Promise<void> {
    const supabase = await createClient();
    const { provider, data } = event;

    const paymentId = data.payment_id || data.id;
    const invoiceId = data.invoice_id;
    const amountCents = data.amount || data.amount_cents;
    const currency = data.currency || 'INR';
    const failureReason = data.failure_reason || data.error_description;

    if (!paymentId || !invoiceId) {
      throw new Error('Missing required payment data');
    }

    // Check for existing payment
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('provider', provider)
      .eq('provider_payment_id', paymentId)
      .single();

    if (existingPayment) {
      // Update existing payment to failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          metadata: { ...data, failure_reason: failureReason },
        })
        .eq('id', existingPayment.id);
    } else {
      // Create failed payment record
      await supabase.from('payments').insert({
        invoice_id: invoiceId,
        provider,
        provider_payment_id: paymentId,
        amount_cents: amountCents,
        currency,
        status: 'failed',
        metadata: { ...data, failure_reason: failureReason },
      });
    }

    // Get invoice and subscription
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoice && invoice.subscription_id) {
      // Mark subscription as past_due after failed payment
      await supabase
        .from('org_subscriptions')
        .update({ status: 'past_due' })
        .eq('id', invoice.subscription_id);

      // Create audit log
      await supabase.from('billing_audit_log').insert({
        org_id: invoice.org_id,
        event_type: 'payment_failed',
        metadata: { 
          payment_id: paymentId, 
          invoice_id: invoiceId, 
          failure_reason: failureReason 
        },
      });
    }

    console.log(`Payment ${paymentId} failed: ${failureReason}`);
  }

  /**
   * Process subscription renewal webhook
   */
  static async processSubscriptionRenewal(event: WebhookEvent): Promise<void> {
    const supabase = await createClient();
    const { data } = event;

    const subscriptionId = data.subscription_id;
    const newPeriodStart = new Date(data.current_period_start * 1000);
    const newPeriodEnd = new Date(data.current_period_end * 1000);

    if (!subscriptionId) {
      throw new Error('Missing subscription_id');
    }

    // Update subscription period
    const { data: subscription, error } = await supabase
      .from('org_subscriptions')
      .update({
        current_period_start: newPeriodStart.toISOString(),
        current_period_end: newPeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }

    // Create renewal invoice
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single();

    if (plan) {
      await supabase.from('invoices').insert({
        org_id: subscription.org_id,
        subscription_id: subscriptionId,
        amount_cents: plan.price_cents,
        currency: plan.currency,
        status: 'open',
        due_at: newPeriodEnd.toISOString(),
        line_items: [
          {
            description: `${plan.name} - ${plan.interval} subscription (renewal)`,
            quantity: 1,
            unit_amount_cents: plan.price_cents,
            total_cents: plan.price_cents,
          },
        ],
        corr_id: `renewal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    console.log(`Subscription ${subscriptionId} renewed`);
  }

  /**
   * Process trial ending webhook
   */
  static async processTrialEnding(event: WebhookEvent): Promise<void> {
    const supabase = await createClient();
    const { data } = event;

    const subscriptionId = data.subscription_id;

    if (!subscriptionId) {
      throw new Error('Missing subscription_id');
    }

    const { data: subscription } = await supabase
      .from('org_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subscription) {
      // Update status from trial to active
      await supabase
        .from('org_subscriptions')
        .update({ status: 'active' })
        .eq('id', subscriptionId);

      // Create audit log
      await supabase.from('billing_audit_log').insert({
        org_id: subscription.org_id,
        event_type: 'trial_ended',
        metadata: { subscription_id: subscriptionId },
      });

      console.log(`Trial ended for subscription ${subscriptionId}`);
    }
  }
}

/**
 * Main webhook handler factory
 */
export function createWebhookHandler(provider: string, config: WebhookConfig) {
  return async (request: Request): Promise<Response> => {
    try {
      // Get raw body and signature
      const body = await request.text();
      const signature = request.headers.get(config.signatureHeader);
      const timestamp = config.timestampHeader
        ? parseInt(request.headers.get(config.timestampHeader) || '0', 10)
        : undefined;

      if (!signature) {
        return new Response('Missing signature', { status: 401 });
      }

      // Verify signature
      let isValid = false;
      if (provider === 'razorpay') {
        isValid = WebhookVerifier.verifyRazorpay(body, signature, config.secret);
      } else if (provider === 'stripe' && timestamp) {
        isValid = WebhookVerifier.verifyStripe(body, signature, config.secret, timestamp);
      } else {
        isValid = WebhookVerifier.verifySignature(body, signature, config.secret, timestamp);
      }

      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }

      // Parse event
      const event: WebhookEvent = JSON.parse(body);
      event.provider = provider;

      // Process event based on type
      const eventType = event.type || event.data?.event;

      switch (eventType) {
        case 'payment.success':
        case 'payment.succeeded':
        case 'charge.succeeded':
          await WebhookProcessor.processPaymentSuccess(event);
          break;

        case 'payment.failed':
        case 'charge.failed':
          await WebhookProcessor.processPaymentFailure(event);
          break;

        case 'subscription.renewed':
        case 'invoice.payment_succeeded':
          await WebhookProcessor.processSubscriptionRenewal(event);
          break;

        case 'subscription.trial_will_end':
          await WebhookProcessor.processTrialEnding(event);
          break;

        default:
          console.log(`Unhandled webhook event type: ${eventType}`);
      }

      return new Response('Webhook processed', { status: 200 });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return new Response('Webhook processing failed', { status: 500 });
    }
  };
}
