// POST /api/billing/subscribe
// Create a new subscription for an organization

import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/billing';
import type { SubscribeRequest } from '@/lib/billing/types';

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeRequest = await request.json();
    
    // Validate required fields
    if (!body.org_id || !body.plan_code) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: org_id and plan_code are required',
        },
        { status: 400 }
      );
    }

    // Create subscription
    const result = await BillingService.subscribe(body);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
