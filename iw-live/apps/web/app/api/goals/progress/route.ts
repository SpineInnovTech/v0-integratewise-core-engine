import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  calculateGoalProgress,
  calculateWeightedProgress,
  updateGoalProgress,
  getAllGoalProgress,
} from '@/lib/goals/progress';

/**
 * GOALS-015: Progress Calculation API
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goal_id');
    const workspaceId = searchParams.get('workspace_id');
    const weighted = searchParams.get('weighted') === 'true';
    const goalIds = searchParams.get('goal_ids')?.split(',');

    if (goalId) {
      const progress = await calculateGoalProgress(goalId);
      return NextResponse.json({ success: true, data: progress });
    }

    if (workspaceId) {
      if (weighted) {
        const result = await calculateWeightedProgress(workspaceId, goalIds);
        return NextResponse.json({ success: true, data: result });
      } else {
        const progresses = await getAllGoalProgress(workspaceId);
        return NextResponse.json({ success: true, data: progresses });
      }
    }

    return NextResponse.json(
      { error: 'goal_id or workspace_id required' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get progress' },
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
    const { goalId, newValue } = body;

    if (!goalId || newValue === undefined) {
      return NextResponse.json(
        { error: 'goalId and newValue required' },
        { status: 400 }
      );
    }

    const progress = await updateGoalProgress(goalId, newValue);

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update progress' },
      { status: 500 }
    );
  }
}
