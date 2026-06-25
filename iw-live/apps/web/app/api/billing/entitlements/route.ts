// GET /api/billing/entitlements?org_id=xxx
// Get entitlements for an organization

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

    const entitlements = await BillingService.getEntitlements(org_id);
    
    return NextResponse.json({
      success: true,
      data: entitlements,
    });
  } catch (error) {
    console.error('Error fetching entitlements:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch entitlements',
      },
      { status: 500 }
    );
  }
}
