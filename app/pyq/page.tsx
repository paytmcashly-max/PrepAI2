'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import { generateSamplePYQs, calculatePYQStats, getImportantTopics } from '@/lib/services/pyq-engine';

export default function PYQPage() {
  const [user, setUser] = useState<any>(null);
  const [pyqs, setPYQs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterTopic, setFilterTopic] = useState<string>('');
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

        // For now, generate sample PYQs
        // In production, these would come from the database
        const samplePYQs = generateSamplePYQs();
        setPYQs(samplePYQs);
      } catch (err) {
        console.error('[v0] Load PYQ error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const stats = calculatePYQStats(pyqs);
  const years = Object.keys(stats.byYear).map(Number).sort((a, b) => b - a);
  const subjects = Object.keys(stats.bySubject).sort();
  const topics = Object.keys(stats.byTopic).sort();

  const filteredPYQs = pyqs.filter(pyq => {
    if (filterYear && pyq.year !== parseInt(filterYear)) return false;
    if (filterSubject && pyq.subject !== filterSubject) return false;
    if (filterTopic && pyq.topic !== filterTopic) return false;
    return true;
  });

  const importantTopics = filterSubject
    ? getImportantTopics(pyqs, filterSubject).slice(0, 5)
    : [];

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
          <h1 className="text-4xl font-bold text-foreground mb-2">PYQ Practice</h1>
          <p className="text-muted-foreground">
            Practice with previous year questions and improve your exam preparation
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border"
          >
            <p className="text-muted-foreground text-sm mb-2">Total Questions</p>
            <p className="text-3xl font-bold text-primary">{stats.totalQuestions}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border"
          >
            <p className="text-muted-foreground text-sm mb-2">Years Covered</p>
            <p className="text-3xl font-bold text-primary">{Object.keys(stats.byYear).length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border"
          >
            <p className="text-muted-foreground text-sm mb-2">Subjects</p>
            <p className="text-3xl font-bold text-primary">{Object.keys(stats.bySubject).length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border"
          >
            <p className="text-muted-foreground text-sm mb-2">Topics</p>
            <p className="text-3xl font-bold text-primary">{Object.keys(stats.byTopic).length}</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Topic</label>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Topics</option>
              {topics.map(topic => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredPYQs.length > 0 ? (
                filteredPYQs.map((pyq, index) => (
                  <motion.div
                    key={pyq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border hover:shadow-lg transition-all"
                  >
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {pyq.subject} - {pyq.topic} ({pyq.year})
                          </h3>
                          <p className="text-muted-foreground">{pyq.content}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          pyq.difficulty === 'easy'
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : pyq.difficulty === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        }`}>
                          {pyq.difficulty}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        {pyq.options.map((option: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded border border-border">
                            <span className="font-semibold text-primary">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            <span className="text-foreground">{option}</span>
                          </div>
                        ))}
                      </div>

                      {pyq.explanation && (
                        <details className="border-t border-border pt-4">
                          <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
                            View Explanation
                          </summary>
                          <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-border">
                            {pyq.explanation}
                          </p>
                        </details>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-foreground text-sm">
                        Q{pyq.questionNumber}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-foreground text-sm">
                        Appeared {pyq.frequency} times
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-border">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">No Questions Found</h2>
                  <p className="text-muted-foreground">
                    Try changing your filters to find questions
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Important Topics */}
            {importantTopics.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border sticky top-24">
                <h3 className="font-bold text-foreground mb-4">Important Topics</h3>
                <div className="space-y-3">
                  {importantTopics.map(topic => (
                    <button
                      key={topic.topic}
                      onClick={() => setFilterTopic(topic.topic)}
                      className="w-full text-left p-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-primary hover:text-white transition-colors"
                    >
                      <p className="font-medium text-sm">{topic.topic}</p>
                      <p className="text-xs opacity-75">
                        {topic.frequency} questions
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
