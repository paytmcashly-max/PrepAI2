// Mock Test Engine Service

export interface Question {
  id: string;
  number: number;
  subject: string;
  content: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
}

export interface MockTest {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  passingScore: number;
}

export interface TestAttempt {
  id: string;
  mockTestId: string;
  userId: string;
  answers: Record<string, string>; // questionId -> selectedAnswer
  startTime: Date;
  endTime?: Date;
  score?: number;
  status: 'in-progress' | 'completed' | 'abandoned';
}

// Generate sample mock test
export function generateSampleMockTest(title: string): MockTest {
  return {
    id: `mock-${Date.now()}`,
    title,
    description: `Full-length mock test - ${title}`,
    totalQuestions: 100,
    timeLimitMinutes: 120,
    passingScore: 60,
  };
}

// Generate sample questions for testing
export function generateSampleQuestions(count: number = 100): Question[] {
  const subjects = ['Mathematics', 'General Knowledge', 'Hindi', 'Reasoning', 'Physical'];
  const difficulties = ['easy', 'medium', 'hard'];

  const questions: Question[] = [];

  for (let i = 1; i <= count; i++) {
    const subject = subjects[i % subjects.length];
    const difficulty = difficulties[i % difficulties.length];

    questions.push({
      id: `q-${i}`,
      number: i,
      subject,
      content: `Question ${i}: This is a sample ${difficulty} difficulty question about ${subject.toLowerCase()}.`,
      options: [
        `Option A - Correct answer for Q${i}`,
        `Option B - Incorrect option 1 for Q${i}`,
        `Option C - Incorrect option 2 for Q${i}`,
        `Option D - Incorrect option 3 for Q${i}`,
      ],
      correctAnswer: 'Option A',
      explanation: `This is the explanation for question ${i}. The correct answer is Option A because...`,
      difficulty,
    });
  }

  return questions;
}

// Calculate test score
export function calculateScore(
  questions: Question[],
  answers: Record<string, string>
): { correct: number; wrong: number; unanswered: number; percentage: number } {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  for (const question of questions) {
    const userAnswer = answers[question.id];

    if (!userAnswer) {
      unanswered++;
    } else if (userAnswer === question.correctAnswer) {
      correct++;
    } else {
      wrong++;
    }
  }

  const percentage = Math.round((correct / questions.length) * 100);

  return {
    correct,
    wrong,
    unanswered,
    percentage,
  };
}

// Get questions by subject
export function getQuestionsBySubject(
  questions: Question[],
  subject: string
): Question[] {
  return questions.filter(q => q.subject === subject);
}

// Get questions by difficulty
export function getQuestionsByDifficulty(
  questions: Question[],
  difficulty: string
): Question[] {
  return questions.filter(q => q.difficulty === difficulty);
}

// Shuffle questions for randomization
export function shuffleQuestions(questions: Question[]): Question[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Format time remaining
export function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Check if test time is up
export function isTimeUp(startTime: Date, timeLimitMinutes: number): boolean {
  const elapsed = (Date.now() - startTime.getTime()) / 1000;
  return elapsed > timeLimitMinutes * 60;
}

// Get time remaining in seconds
export function getTimeRemaining(startTime: Date, timeLimitMinutes: number): number {
  const elapsed = (Date.now() - startTime.getTime()) / 1000;
  const remaining = timeLimitMinutes * 60 - elapsed;
  return Math.max(0, Math.ceil(remaining));
}

// Generate performance report
export function generatePerformanceReport(
  questions: Question[],
  answers: Record<string, string>,
  timeTakenSeconds: number
) {
  const score = calculateScore(questions, answers);
  const subjectPerformance: Record<string, any> = {};

  for (const subject of [...new Set(questions.map(q => q.subject))]) {
    const subjectQuestions = getQuestionsBySubject(questions, subject);
    const subjectAnswers: Record<string, string> = {};

    for (const q of subjectQuestions) {
      if (answers[q.id]) {
        subjectAnswers[q.id] = answers[q.id];
      }
    }

    const subjectScore = calculateScore(subjectQuestions, subjectAnswers);
    subjectPerformance[subject] = subjectScore;
  }

  return {
    totalScore: score,
    subjectPerformance,
    timeTaken: Math.floor(timeTakenSeconds / 60),
    speed: Math.round(questions.length / (timeTakenSeconds / 60)),
  };
}
