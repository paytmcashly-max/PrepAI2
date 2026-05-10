import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface MockTestQuestion {
  id: string;
  subject_id: string | null;
  correct_answer: string;
  subject?: { name: string | null } | { name: string | null }[] | null;
}

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
    const answers = body.answers && typeof body.answers === 'object' ? body.answers as Record<string, string> : {};

    // Get the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('mock_test_attempts')
      .select('*, mock_test:mock_tests(*)')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Get all questions for this test
    const { data: questions, error: questionsError } = await supabase
      .from('mock_test_questions')
      .select('id, subject_id, correct_answer, subject:subjects(name)')
      .eq('mock_test_id', attempt.mock_test_id);

    if (questionsError) throw questionsError;

    const typedQuestions = (questions || []) as unknown as MockTestQuestion[];
    const correct = typedQuestions.filter(q => answers[q.id] === q.correct_answer).length;
    const unanswered = typedQuestions.filter(q => !answers[q.id]).length;
    const wrong = Math.max(0, typedQuestions.length - correct - unanswered);
    const totalMarks = typedQuestions.length;
    const startedAt = attempt.started_at ? new Date(attempt.started_at).getTime() : Date.now();
    const timeTakenSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));

    // Update attempt with final data
    const { data: updatedAttempt, error: updateError } = await supabase
      .from('mock_test_attempts')
      .update({
        answers,
        completed_at: new Date().toISOString(),
        marks_obtained: correct,
        total_marks: totalMarks,
        correct_answers: correct,
        wrong_answers: wrong,
        unanswered,
        time_taken_seconds: timeTakenSeconds,
        weak_areas: [],
        status: 'completed',
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create performance summary
    const subjectPerformance: Record<string, any> = {};
    const subjectNameFor = (question: MockTestQuestion) => {
      const subject = Array.isArray(question.subject) ? question.subject[0] : question.subject;
      return subject?.name || 'General';
    };

    for (const subject of [...new Set(typedQuestions.map(subjectNameFor))]) {
      const subjectQuestions = typedQuestions.filter(q => subjectNameFor(q) === subject);
      let subjectCorrect = 0;

      for (const q of subjectQuestions) {
        if (answers[q.id] === q.correct_answer) {
          subjectCorrect++;
        }
      }

      subjectPerformance[subject] = {
        correct: subjectCorrect,
        total: subjectQuestions.length,
        percentage: subjectQuestions.length > 0 ? Math.round((subjectCorrect / subjectQuestions.length) * 100) : 0,
      };
    }

    const percentage = totalMarks > 0 ? Math.round((correct / totalMarks) * 100) : 0;

    return NextResponse.json({
      attempt: updatedAttempt,
      performance: {
        overall: percentage,
        correct,
        wrong,
        unanswered,
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
