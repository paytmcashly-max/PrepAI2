'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatTimeRemaining, getTimeRemaining } from '@/lib/services/mock-test-engine';

export default function TestAttemptPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.attemptId as string;
  const testId = params.testId as string;

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempt, setAttempt] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Get test
        const { data: testData } = await supabase
          .from('mock_tests')
          .select('*')
          .eq('id', testId)
          .single();

        setTest(testData);

        // Get attempt
        const { data: attemptData } = await supabase
          .from('mock_test_attempts')
          .select('*')
          .eq('id', attemptId)
          .eq('user_id', user.id)
          .single();

        setAttempt(attemptData);
        if (attemptData?.answers) {
          setAnswers(attemptData.answers);
        }

        // Get questions
        const { data: questionsData } = await supabase
          .from('mock_test_questions')
          .select('*, subject:subjects(name)')
          .eq('mock_test_id', testId)
          .order('order_index', { ascending: true });

        setQuestions(questionsData || []);

        // Set initial time remaining
        if (attemptData && testData) {
          const remaining = getTimeRemaining(
            new Date(attemptData.started_at),
            testData.duration_minutes
          );
          setTimeRemaining(remaining);
        }
      } catch (err) {
        console.error('[v0] Load test data error:', err);
        toast.error('Failed to load test data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, testId, attemptId]);

  const handleSubmitTest = useCallback(async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/mock-tests/attempts/${attemptId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        }
      );

      if (!response.ok) throw new Error('Failed to submit test');

      toast.success('Test submitted successfully!');
      router.push(`/mock-tests/${testId}/results/${attemptId}`);
    } catch (err) {
      console.error('[v0] Submit test error:', err);
      toast.error('Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  }, [answers, attemptId, router, testId]);

  // Timer effect
  useEffect(() => {
    if (!test || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          handleSubmitTest();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleSubmitTest, test, timeRemaining]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  if (loading || !test || !attempt || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answered = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50 dark:to-blue-950/10">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{test.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>

            {/* Timer */}
            <div
              className={`text-3xl font-bold ${
                timeRemaining < 300
                  ? 'text-red-500'
                  : timeRemaining < 600
                    ? 'text-yellow-500'
                    : 'text-primary'
              }`}
            >
              ⏱️ {formatTimeRemaining(timeRemaining)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Progress</p>
              <p className="text-sm text-muted-foreground">
                {answered} answered
              </p>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-border"
            >
              <div className="mb-6">
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  {currentQuestion.subject?.name || 'General'}
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Q{currentQuestion.order_index + 1}: {currentQuestion.question}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options?.map((option: string, idx: number) => (
                    <label
                      key={idx}
                      className="flex items-center gap-4 p-4 rounded-lg border-2 border-border hover:border-primary cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={`q-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) =>
                          handleAnswerChange(currentQuestion.id, e.target.value)
                        }
                        className="w-5 h-5"
                      />
                      <span className="text-foreground">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Question Navigator */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border sticky top-24">
              <h3 className="font-bold text-foreground mb-4">Questions</h3>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`aspect-square rounded-lg font-medium text-sm transition-colors ${
                      idx === currentQuestionIndex
                        ? 'bg-primary text-white'
                        : answers[q.id]
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-foreground hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary"></div>
                  <span className="text-xs text-muted-foreground">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-xs text-muted-foreground">Answered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-8">
          <Button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            Previous
          </Button>

          <Button
            onClick={() =>
              setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))
            }
            disabled={currentQuestionIndex === questions.length - 1}
            variant="outline"
          >
            Next
          </Button>

          <div className="flex-1"></div>

          <Button
            onClick={handleSubmitTest}
            disabled={submitting}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </Button>
        </div>
      </main>
    </div>
  );
}
