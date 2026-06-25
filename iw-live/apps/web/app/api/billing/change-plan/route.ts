// POST /api/billing/change-plan
// Change subscription plan with optional proration

import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/billing';
import type { ChangePlanRequest } from '@/lib/billing/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChangePlanRequest = await request.json();
    
    // Validate required fields
    if (!body.org_id || !body.new_plan_code) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: org_id and new_plan_code are required',
        },
        { status: 400 }
      );
    }

    // Change plan
    const result = await BillingService.changePlan(body);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to change plan';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
