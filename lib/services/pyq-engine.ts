// PYQ (Previous Year Questions) Engine

export interface PYQQuestion {
  id: string;
  questionNumber: number;
  year: number;
  subject: string;
  topic: string;
  content: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  explanation?: string;
  source?: string;
  frequency?: number; // How many times similar question appeared
}

export interface PYQStats {
  totalQuestions: number;
  byYear: Record<number, number>;
  bySubject: Record<string, number>;
  byDifficulty: Record<string, number>;
  byTopic: Record<string, number>;
}

// Generate sample PYQ data
export function generateSamplePYQs(): PYQQuestion[] {
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
  const subjects = ['Mathematics', 'General Knowledge', 'Hindi', 'Reasoning', 'Physical'];
  const topics: Record<string, string[]> = {
    Mathematics: ['Algebra', 'Geometry', 'Trigonometry', 'Number System', 'Percentage'],
    'General Knowledge': ['History', 'Geography', 'Science', 'Current Affairs', 'Culture'],
    Hindi: ['Grammar', 'Comprehension', 'Vocabulary', 'Literature', 'Idioms'],
    Reasoning: ['Logical', 'Analytical', 'Coding', 'Pattern', 'Series'],
    Physical: ['Speed', 'Agility', 'Strength', 'Endurance', 'Coordination'],
  };
  const difficulties = ['easy', 'medium', 'hard'];

  const pyqs: PYQQuestion[] = [];
  let id = 1;

  for (const year of years) {
    for (const subject of subjects) {
      for (let i = 0; i < 10; i++) {
        const topicList = topics[subject] || ['General'];
        const topic = topicList[i % topicList.length];

        pyqs.push({
          id: `pyq-${id}`,
          questionNumber: id,
          year,
          subject,
          topic,
          content: `PYQ ${year} - ${subject} Question ${i + 1}: Sample question about ${topic}`,
          options: [
            'Option A - Sample answer',
            'Option B - Sample answer',
            'Option C - Sample answer',
            'Option D - Sample answer',
          ],
          correctAnswer: 'Option A',
          difficulty: difficulties[i % difficulties.length],
          explanation: `This question tests your knowledge of ${topic} in ${subject}. The correct answer is Option A.`,
          source: `Exam ${year}`,
          frequency: Math.ceil(Math.random() * 5),
        });

        id++;
      }
    }
  }

  return pyqs;
}

// Get PYQ statistics
export function calculatePYQStats(pyqs: PYQQuestion[]): PYQStats {
  const stats: PYQStats = {
    totalQuestions: pyqs.length,
    byYear: {},
    bySubject: {},
    byDifficulty: {},
    byTopic: {},
  };

  for (const pyq of pyqs) {
    // By year
    stats.byYear[pyq.year] = (stats.byYear[pyq.year] || 0) + 1;

    // By subject
    stats.bySubject[pyq.subject] = (stats.bySubject[pyq.subject] || 0) + 1;

    // By difficulty
    stats.byDifficulty[pyq.difficulty] = (stats.byDifficulty[pyq.difficulty] || 0) + 1;

    // By topic
    stats.byTopic[pyq.topic] = (stats.byTopic[pyq.topic] || 0) + 1;
  }

  return stats;
}

// Filter PYQs
export function filterPYQs(
  pyqs: PYQQuestion[],
  filters?: {
    year?: number;
    subject?: string;
    topic?: string;
    difficulty?: string;
  }
): PYQQuestion[] {
  return pyqs.filter(pyq => {
    if (filters?.year && pyq.year !== filters.year) return false;
    if (filters?.subject && pyq.subject !== filters.subject) return false;
    if (filters?.topic && pyq.topic !== filters.topic) return false;
    if (filters?.difficulty && pyq.difficulty !== filters.difficulty) return false;
    return true;
  });
}

// Get frequently asked questions
export function getFrequentlyAsked(pyqs: PYQQuestion[], limit: number = 10): PYQQuestion[] {
  return [...pyqs]
    .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
    .slice(0, limit);
}

// Get important topics
export function getImportantTopics(
  pyqs: PYQQuestion[],
  subject: string
): Array<{ topic: string; frequency: number; years: number[] }> {
  const topicMap: Record<string, { frequency: number; years: Set<number> }> = {};

  for (const pyq of pyqs) {
    if (pyq.subject !== subject) continue;

    if (!topicMap[pyq.topic]) {
      topicMap[pyq.topic] = { frequency: 0, years: new Set() };
    }

    topicMap[pyq.topic].frequency++;
    topicMap[pyq.topic].years.add(pyq.year);
  }

  return Object.entries(topicMap)
    .map(([topic, data]) => ({
      topic,
      frequency: data.frequency,
      years: Array.from(data.years),
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

// Get year-wise analysis
export function getYearWiseAnalysis(
  pyqs: PYQQuestion[],
  subject: string
): Array<{
  year: number;
  total: number;
  easy: number;
  medium: number;
  hard: number;
}> {
  const yearMap: Record<
    number,
    { total: number; easy: number; medium: number; hard: number }
  > = {};

  for (const pyq of pyqs) {
    if (pyq.subject !== subject) continue;

    if (!yearMap[pyq.year]) {
      yearMap[pyq.year] = { total: 0, easy: 0, medium: 0, hard: 0 };
    }

    yearMap[pyq.year].total++;
    yearMap[pyq.year][pyq.difficulty as 'easy' | 'medium' | 'hard']++;
  }

  return Object.entries(yearMap)
    .map(([year, data]) => ({
      year: parseInt(year),
      ...data,
    }))
    .sort((a, b) => a.year - b.year);
}

// Get weak areas
export function analyzeWeakAreas(
  pyqs: PYQQuestion[],
  userAnswers: Record<string, string>
): Array<{ subject: string; topic: string; accuracy: number; needsFocus: boolean }> {
  const topicStats: Record<string, { correct: number; total: number }> = {};

  for (const pyq of pyqs) {
    const key = `${pyq.subject}-${pyq.topic}`;
    if (!topicStats[key]) {
      topicStats[key] = { correct: 0, total: 0 };
    }

    topicStats[key].total++;

    if (userAnswers[pyq.id] === pyq.correctAnswer) {
      topicStats[key].correct++;
    }
  }

  return Object.entries(topicStats)
    .map(([key, stats]) => {
      const [subject, topic] = key.split('-');
      const accuracy = Math.round((stats.correct / stats.total) * 100);

      return {
        subject,
        topic,
        accuracy,
        needsFocus: accuracy < 60,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);
}
