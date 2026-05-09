import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { calculateScore } from '@/lib/services/mock-test-engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const attemptId = (await params).attemptId;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { answers } = body;

    // Get the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .select('*, mock_tests(*)')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Get all questions for this test
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('mock_test_id', attempt.mock_test_id);

    if (questionsError) throw questionsError;

    // Calculate score
    const score = calculateScore(questions || [], answers);
    const percentage = score.percentage;
    const passed = percentage >= (attempt.mock_tests?.passing_score || 60);

    // Update attempt with final data
    const { data: updatedAttempt, error: updateError } = await supabase
      .from('test_attempts')
      .update({
        answers,
        end_time: new Date().toISOString(),
        score: percentage,
        status: 'completed',
        passed,
        correct_count: score.correct,
        wrong_count: score.wrong,
        unanswered_count: score.unanswered,
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create performance summary
    const subjectPerformance: Record<string, any> = {};
    for (const subject of [...new Set(questions?.map(q => q.subject) || [])]) {
      const subjectQuestions = questions?.filter(q => q.subject === subject) || [];
      let correct = 0;

      for (const q of subjectQuestions) {
        if (answers[q.id] === q.correct_answer) {
          correct++;
        }
      }

      subjectPerformance[subject] = {
        correct,
        total: subjectQuestions.length,
        percentage: subjectQuestions.length > 0 ? Math.round((correct / subjectQuestions.length) * 100) : 0,
      };
    }

    return NextResponse.json({
      attempt: updatedAttempt,
      performance: {
        overall: percentage,
        passed,
        correct: score.correct,
        wrong: score.wrong,
        unanswered: score.unanswered,
        bySubject: subjectPerformance,
      },
    });
  } catch (err) {
    console.error('[v0] POST submit error:', err);
    return NextResponse.json(
      { error: 'Failed to submit test' },
      { status: 500 }
    );
  }
}
