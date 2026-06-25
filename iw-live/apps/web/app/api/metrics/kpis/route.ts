import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLensKPIs, getAllKPIs } from '@/lib/metrics/lens-kpis';
import type { Lens } from '@/lib/metrics/lens-kpis';

/**
 * METRICS-016: Lens-Specific KPIs API
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');
    const lens = searchParams.get('lens') as Lens | null;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    if (lens) {
      const kpis = await getLensKPIs(workspaceId, lens);
      return NextResponse.json({ success: true, data: kpis });
    } else {
      const allKPIs = await getAllKPIs(workspaceId);
      return NextResponse.json({ success: true, data: allKPIs });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get KPIs' },
      { status: 500 }
    );
  }
}
