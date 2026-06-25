// POST /api/billing/webhook/[provider]
// Handle payment provider webhooks with signature verification

import { NextRequest, NextResponse } from 'next/server';
import { createWebhookHandler } from '@/lib/billing/webhooks';

// Configuration for different providers
const WEBHOOK_CONFIGS = {
  razorpay: {
    secret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    signatureHeader: 'x-razorpay-signature',
  },
  stripe: {
    secret: process.env.STRIPE_WEBHOOK_SECRET || '',
    signatureHeader: 'stripe-signature',
    timestampHeader: 'stripe-timestamp',
  },
  cashfree: {
    secret: process.env.CASHFREE_WEBHOOK_SECRET || '',
    signatureHeader: 'x-cashfree-signature',
  },
  phonepe: {
    secret: process.env.PHONEPE_WEBHOOK_SECRET || '',
    signatureHeader: 'x-phonepe-signature',
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider.toLowerCase();

  // Check if provider is supported
  if (!WEBHOOK_CONFIGS[provider as keyof typeof WEBHOOK_CONFIGS]) {
    return NextResponse.json(
      {
        success: false,
        error: `Unsupported provider: ${provider}`,
      },
      { status: 400 }
    );
  }

  const config = WEBHOOK_CONFIGS[provider as keyof typeof WEBHOOK_CONFIGS];

  // Check if webhook secret is configured
  if (!config.secret) {
    console.error(`Webhook secret not configured for provider: ${provider}`);
    return NextResponse.json(
      {
        success: false,
        error: 'Webhook secret not configured',
      },
      { status: 500 }
    );
  }

  // Create and execute webhook handler
  const handler = createWebhookHandler(provider, config);
  return handler(request);
}

// Also support GET for webhook verification (some providers require this)
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider.toLowerCase();
  const searchParams = request.nextUrl.searchParams;
  
  // For providers that require webhook URL verification
  const challenge = searchParams.get('hub.challenge') || searchParams.get('challenge');
  
  if (challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({
    success: true,
    provider,
    message: 'Webhook endpoint is active',
  });
}
