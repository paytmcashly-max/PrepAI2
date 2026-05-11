import { createClient } from '@/lib/supabase/server';
import { todayLocalDateString } from '@/lib/date-utils';
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

    const { data: mockTest, error: mockTestError } = await supabase
      .from('mock_tests')
      .select('id, total_questions, is_active')
      .eq('id', testId)
      .single();

    if (mockTestError || !mockTest) {
      return NextResponse.json({ error: 'Mock test not found' }, { status: 404 });
    }

    if (!mockTest.is_active || !mockTest.total_questions || mockTest.total_questions <= 0) {
      return NextResponse.json({ error: 'This mock question set is not available yet.' }, { status: 400 });
    }

    const { data: attempt, error: attemptError } = await supabase
      .from('mock_test_attempts')
      .insert({
        mock_test_id: testId,
        user_id: user.id,
        answers: {},
        test_date: todayLocalDateString(),
        total_marks: mockTest.total_questions,
        marks_obtained: 0,
        correct_answers: 0,
        wrong_answers: 0,
        unanswered: mockTest.total_questions,
        status: 'in_progress',
        started_at: new Date().toISOString(),
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
      .from('mock_test_attempts')
      .select('*')
      .eq('mock_test_id', testId)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

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
