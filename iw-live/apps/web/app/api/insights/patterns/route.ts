import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectPatternsBatch, detectPatternsIncremental, getDetectedPatterns } from '@/lib/insights/pattern-detection';

/**
 * INSIGHTS-013: Pattern Detection API
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
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    const patterns = await getDetectedPatterns(workspaceId, limit);

    return NextResponse.json({
      success: true,
      data: patterns,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get patterns' },
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
    const { workspaceId, metric, timeframe, threshold, newValue, mode } = body;

    if (!workspaceId || !metric) {
      return NextResponse.json(
        { error: 'workspaceId and metric required' },
        { status: 400 }
      );
    }

    let patterns;
    if (mode === 'incremental' && newValue !== undefined) {
      patterns = await detectPatternsIncremental(
        { workspaceId, metric, timeframe, threshold },
        newValue
      );
    } else {
      patterns = await detectPatternsBatch({
        workspaceId,
        metric,
        timeframe: timeframe || 'day',
        threshold,
      });
    }

    return NextResponse.json({
      success: true,
      data: patterns,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to detect patterns' },
      { status: 500 }
    );
  }
}
