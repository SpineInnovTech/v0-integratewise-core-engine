// GET /api/billing/invoices?org_id=xxx
// Get invoices for an organization

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

    const invoices = await BillingService.getInvoices(org_id);
    
    return NextResponse.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch invoices',
      },
      { status: 500 }
    );
  }
}
