import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateHealthScore, getHealthScore } from '@/lib/cs/health-score';

/**
 * CS-019: Health Score API
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

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    const healthScore = await getHealthScore(workspaceId);

    return NextResponse.json({
      success: true,
      data: healthScore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get health score' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, technicalScore, adoptionScore, engagementScore, riskSignals } = body;

    const result = await calculateHealthScore({
      workspaceId,
      technicalScore,
      adoptionScore,
      engagementScore,
      riskSignals,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to calculate health score' },
      { status: 500 }
    );
  }
}
