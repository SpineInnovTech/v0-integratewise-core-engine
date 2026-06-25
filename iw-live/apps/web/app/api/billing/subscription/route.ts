// GET /api/billing/subscription?org_id=xxx
// Get subscription details for an organization

import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/billing';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const org_id = searchParams.get('org_id');
    
    if (!org_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: org_id',
        },
        { status: 400 }
      );
    }

    const subscription = await BillingService.getSubscription(org_id);
    
    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'No subscription found for this organization',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscription',
      },
      { status: 500 }
    );
  }
}
