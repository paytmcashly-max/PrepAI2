'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.attemptId as string;
  const testId = params.testId as string;

  const [user, setUser] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        setUser(user);

        // Get test and attempt
        const [{ data: testData }, { data: attemptData }, { data: questionsData }] = await Promise.all([
          supabase.from('mock_tests').select('*').eq('id', testId).single(),
          supabase
            .from('mock_test_attempts')
            .select('*')
            .eq('id', attemptId)
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('mock_test_questions')
            .select('*, subject:subjects(name)')
            .eq('mock_test_id', testId)
            .order('order_index', { ascending: true }),
        ]);

        setTest(testData);
        setAttempt(attemptData);
        setQuestions(questionsData || []);
      } catch (err) {
        console.error('[v0] Load results error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, testId, attemptId]);

  if (loading || !user || !test || !attempt) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner />
      </div>
    );
  }

  const subjectStats: Record<string, { correct: number; total: number }> = {};
  
  for (const question of questions) {
    const subject = question.subject?.name || 'General';
    if (!subjectStats[subject]) {
      subjectStats[subject] = { correct: 0, total: 0 };
    }
    subjectStats[subject].total++;

    if (attempt.answers[question.id] === question.correct_answer) {
      subjectStats[subject].correct++;
    }
  }

  const scorePercentage = attempt.total_marks > 0
    ? Math.round(((attempt.marks_obtained || 0) / attempt.total_marks) * 100)
    : 0;
  const isPass = scorePercentage >= 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50 dark:to-blue-950/10">
      <DashboardHeader user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Result Summary */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-8 border-2 mb-8 text-center ${
            isPass
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="text-6xl mb-4">
            {isPass ? '🎉' : '📚'}
          </div>
          <h1 className={`text-4xl font-bold mb-2 ${
            isPass ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          }`}>
            {isPass ? 'Congratulations!' : 'Keep Practicing'}
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            {isPass
              ? `You passed with ${scorePercentage}% score! Great effort!`
              : `You scored ${scorePercentage}%. Keep practicing to improve!`}
          </p>
        </motion.div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border"
          >
            <p className="text-muted-foreground text-sm mb-2">Overall Score</p>
            <p className="text-4xl font-bold text-primary">{scorePercentage}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border"
          >
            <p className="text-muted-foreground text-sm mb-2">Correct Answers</p>
            <p className="text-4xl font-bold text-green-500">{attempt.correct_answers}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border"
          >
            <p className="text-muted-foreground text-sm mb-2">Wrong Answers</p>
            <p className="text-4xl font-bold text-red-500">{attempt.wrong_answers}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border"
          >
            <p className="text-muted-foreground text-sm mb-2">Unanswered</p>
            <p className="text-4xl font-bold text-yellow-500">{attempt.unanswered}</p>
          </motion.div>
        </div>

        {/* Subject-wise Performance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Performance by Subject</h2>
          <div className="space-y-4">
            {Object.entries(subjectStats).map(([subject, stats]) => {
              const percentage = Math.round((stats.correct / stats.total) * 100);
              return (
                <motion.div
                  key={subject}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{subject}</h3>
                    <span className="text-lg font-bold text-primary">
                      {stats.correct}/{stats.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`h-full ${
                        percentage >= 70
                          ? 'bg-green-500'
                          : percentage >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{percentage}% correct</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Answer Review */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Answer Review</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.map((question, idx) => {
              const userAnswer = attempt.answers[question.id];
              const isCorrect = userAnswer === question.correct_answer;

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`border rounded-lg p-4 ${
                    isCorrect
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20'
                      : userAnswer
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20'
                        : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground">
                      Q{question.order_index + 1}: {question.question}
                    </h4>
                    <span className="text-2xl">
                      {isCorrect ? '✅' : userAnswer ? '❌' : '⏭️'}
                    </span>
                  </div>

                  <div className="text-sm mb-2">
                    <p className="text-muted-foreground">
                      Your answer: <span className="font-semibold">{userAnswer || 'Not answered'}</span>
                    </p>
                    {!isCorrect && (
                      <p className="text-muted-foreground">
                        Correct answer: <span className="font-semibold text-green-600">{question.correct_answer}</span>
                      </p>
                    )}
                  </div>

                  {question.explanation && (
                    <p className="text-sm text-muted-foreground italic border-t border-current pt-2 mt-2">
                      {question.explanation}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link href="/mock-tests">
            <Button variant="outline">Back to Tests</Button>
          </Link>
          <Button
            onClick={() => router.push(`/mock-tests/${testId}`)}
            className="bg-gradient-to-r from-primary to-accent text-white"
          >
            Retake Test
          </Button>
        </div>
      </main>
    </div>
  );
}
