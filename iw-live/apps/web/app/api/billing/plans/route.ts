// GET /api/billing/plans
// Returns all active subscription plans

import { NextResponse } from 'next/server';
import { BillingService } from '@/lib/billing';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const plans = await BillingService.getPlans();
    
    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch plans',
      },
      { status: 500 }
    );
  }
}
