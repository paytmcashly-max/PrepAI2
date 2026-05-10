'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function MockTestsPage() {
  const [user, setUser] = useState<any>(null);
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<Map<string, any[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [startingTest, setStartingTest] = useState<string | null>(null);
  const router = useRouter();

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

        // Fetch mock tests
        const { data: testsData } = await supabase
          .from('mock_tests')
          .select('*')
          .order('created_at', { ascending: false });

        setMockTests(testsData || []);

        // Fetch attempts for each test
        if (testsData && testsData.length > 0) {
          const attemptsMap = new Map();

          for (const test of testsData) {
            const { data: testAttempts } = await supabase
              .from('mock_test_attempts')
              .select('*')
              .eq('mock_test_id', test.id)
              .eq('user_id', user.id)
              .order('started_at', { ascending: false });

            if (testAttempts) {
              attemptsMap.set(test.id, testAttempts);
            }
          }

          setAttempts(attemptsMap);
        }
      } catch (err) {
        console.error('[v0] Load mock tests error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleStartTest = async (testId: string) => {
    setStartingTest(testId);
    try {
      const response = await fetch(`/api/mock-tests/${testId}/attempt`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to start test');

      const attempt = await response.json();
      router.push(`/mock-tests/${testId}/attempt/${attempt.id}`);
    } catch (err) {
      console.error('[v0] Start test error:', err);
      toast.error('Failed to start test');
    } finally {
      setStartingTest(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50 dark:to-blue-950/10">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Mock Tests</h1>
          <p className="text-muted-foreground">
            Practice with full-length mock exams and track your performance
          </p>
        </div>

        {mockTests.length > 0 ? (
          <>
            {/* Mock Tests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {mockTests.map((test, index) => {
                const testAttempts = attempts.get(test.id) || [];
                const completedAttempts = testAttempts.filter(a => a.status === 'completed');
                const attemptScore = (attempt: any) => (
                  attempt.total_marks > 0
                    ? Math.round(((attempt.marks_obtained || 0) / attempt.total_marks) * 100)
                    : 0
                );
                const bestScore = completedAttempts.length > 0
                  ? Math.max(...completedAttempts.map(attemptScore))
                  : null;
                const avgScore = completedAttempts.length > 0
                  ? Math.round(completedAttempts.reduce((sum, a) => sum + attemptScore(a), 0) / completedAttempts.length)
                  : null;
                const latestCompletedAttempt = completedAttempts[0];

                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border hover:shadow-lg transition-all"
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-foreground mb-2">{test.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{test.description}</p>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Questions</p>
                          <p className="text-2xl font-bold text-foreground">{test.total_questions}</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Duration</p>
                          <p className="text-2xl font-bold text-foreground">{test.duration_minutes}m</p>
                        </div>
                      </div>

                      {completedAttempts.length > 0 && (
                        <div className="border-t border-border pt-4 mb-4">
                          <p className="text-xs text-muted-foreground mb-3">Your Performance</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Best Score</p>
                              <p className="text-lg font-bold text-green-500">{bestScore}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
                              <p className="text-lg font-bold text-blue-500">{avgScore}%</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {completedAttempts.length} attempt{completedAttempts.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStartTest(test.id)}
                        disabled={startingTest === test.id}
                        className="flex-1 bg-gradient-to-r from-primary to-accent text-white"
                      >
                        {startingTest === test.id ? 'Starting...' : 'Start Test'}
                      </Button>
                      {completedAttempts.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/mock-tests/${test.id}/results/${latestCompletedAttempt.id}`)}
                          className="flex-1"
                        >
                          View Results
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border">
                <p className="text-muted-foreground text-sm mb-2">Total Tests</p>
                <p className="text-3xl font-bold text-foreground">{mockTests.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border">
                <p className="text-muted-foreground text-sm mb-2">Total Attempts</p>
                <p className="text-3xl font-bold text-primary">
                  {Array.from(attempts.values()).reduce((sum, arr) => sum + arr.length, 0)}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border">
                <p className="text-muted-foreground text-sm mb-2">Avg Score</p>
                <p className="text-3xl font-bold text-green-500">
                  {(() => {
                    const allCompleted = Array.from(attempts.values())
                      .flat()
                      .filter(a => a.status === 'completed' && a.total_marks > 0);
                    if (allCompleted.length === 0) return '—';
                    const avg = Math.round(
                      allCompleted.reduce((sum, a) => sum + (((a.marks_obtained || 0) / a.total_marks) * 100), 0) / allCompleted.length
                    );
                    return `${avg}%`;
                  })()}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 border border-border text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No Mock Tests Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first mock test to start practicing.
            </p>
            <Button
              onClick={() => router.push('/mock-tests/create')}
              className="bg-gradient-to-r from-primary to-accent text-white"
            >
              Create Mock Test
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
