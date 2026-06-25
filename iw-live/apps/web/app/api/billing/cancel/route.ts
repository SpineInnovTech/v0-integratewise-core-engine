// POST /api/billing/cancel
// Cancel a subscription

import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/billing';
import type { CancelSubscriptionRequest } from '@/lib/billing/types';

export async function POST(request: NextRequest) {
  try {
    const body: CancelSubscriptionRequest = await request.json();
    
    // Validate required fields
    if (!body.org_id || body.cancel_at_period_end === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: org_id and cancel_at_period_end are required',
        },
        { status: 400 }
      );
    }

    // Cancel subscription
    const result = await BillingService.cancelSubscription(body);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
