import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * SUPPORT-026: Support Contact API
 * 
 * Logs support requests for tracking and analytics
 * Does not send emails (handled client-side via mailto)
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, category, priority, message, email, contextSnapshot, includeLogs } = body;

    // Log support request to database (for analytics)
    const { error } = await supabase.from('support_requests').insert({
      user_id: user.id,
      email: email || user.email,
      subject,
      category,
      priority,
      message,
      context_snapshot: contextSnapshot,
      include_logs: includeLogs,
      status: 'open',
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error logging support request:', error);
      // Don't fail the request - email client already opened
    }

    return NextResponse.json({
      success: true,
      message: 'Support request logged',
    });
  } catch (error: any) {
    console.error('Support contact API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process support request' },
      { status: 500 }
    );
  }
}
