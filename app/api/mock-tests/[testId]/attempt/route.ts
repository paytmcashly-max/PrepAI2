import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const testId = (await params).testId;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create new test attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .insert({
        mock_test_id: testId,
        user_id: user.id,
        answers: {},
        start_time: new Date().toISOString(),
        status: 'in-progress',
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    return NextResponse.json(attempt);
  } catch (err) {
    console.error('[v0] POST attempt error:', err);
    return NextResponse.json(
      { error: 'Failed to start test attempt' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const testId = (await params).testId;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's attempts for this test
    const { data, error } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('mock_test_id', testId)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('[v0] GET attempts error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch attempts' },
      { status: 500 }
    );
  }
}
