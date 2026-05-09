import { createClient } from './client';

// Types
export interface UserProfile {
  id: string;
  full_name?: string;
  exam_target?: string;
  daily_study_hours?: number;
  plan_start_date?: string;
  created_at: string;
}

export interface RoadmapDay {
  id: string;
  day_number: number;
  phase_id: string;
  phase_name: string;
  title: string;
  focus: string;
  quote?: string;
}

export interface DailyTask {
  id: string;
  roadmap_day_id: string;
  subject: string;
  title: string;
  description?: string;
  estimated_minutes?: number;
  priority?: number;
  type?: string;
  resource?: string;
  order_index?: number;
}

export interface TaskCompletion {
  id: string;
  user_id: string;
  task_id: string;
  completed: boolean;
  completed_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  order_index?: number;
  status: string;
}

export interface MockTest {
  id: string;
  user_id: string;
  exam_type: string;
  marks_obtained: number;
  total_marks: number;
  weak_areas?: string[];
  mistakes?: string[];
  test_date: string;
}

export interface Note {
  id: string;
  user_id: string;
  subject: string;
  title: string;
  content: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface PYQQuestion {
  id: string;
  exam: string;
  year: number;
  subject: string;
  topic: string;
  difficulty: string;
  question: string;
  options_json: string[];
  answer: string;
  explanation?: string;
  source?: string;
  verified: boolean;
}

// User Profile Queries
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[v0] Error fetching user profile:', error);
    return null;
  }
  return data;
}

// Calculate current day in 120-day plan
export function calculateCurrentDay(planStartDate: string): number {
  const startDate = new Date(planStartDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(diffDays + 1, 120); // Cap at 120
}

// Roadmap Queries
export async function getRoadmapDay(dayNumber: number): Promise<RoadmapDay | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('roadmap_days')
    .select('*')
    .eq('day_number', dayNumber)
    .single();

  if (error) {
    console.error('[v0] Error fetching roadmap day:', error);
    return null;
  }
  return data;
}

// Daily Task Queries
export async function getDailyTasks(roadmapDayId: string): Promise<DailyTask[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('roadmap_day_id', roadmapDayId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('[v0] Error fetching daily tasks:', error);
    return [];
  }
  return data || [];
}

// Task Completion Queries
export async function getTaskCompletions(userId: string, taskIds: string[]): Promise<TaskCompletion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('task_completions')
    .select('*')
    .eq('user_id', userId)
    .in('task_id', taskIds);

  if (error) {
    console.error('[v0] Error fetching task completions:', error);
    return [];
  }
  return data || [];
}

export async function toggleTaskCompletion(userId: string, taskId: string, completed: boolean): Promise<boolean> {
  const supabase = createClient();

  if (completed) {
    // Insert completion record
    const { error } = await supabase
      .from('task_completions')
      .insert({
        user_id: userId,
        task_id: taskId,
        completed: true,
        completed_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[v0] Error completing task:', error);
      return false;
    }
  } else {
    // Delete completion record
    const { error } = await supabase
      .from('task_completions')
      .delete()
      .eq('user_id', userId)
      .eq('task_id', taskId);

    if (error) {
      console.error('[v0] Error uncompleting task:', error);
      return false;
    }
  }

  return true;
}

// Subject Queries
export async function getSubjects(): Promise<Subject[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('[v0] Error fetching subjects:', error);
    return [];
  }
  return data || [];
}

export async function getChaptersBySubject(subjectId: string): Promise<Chapter[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('subject_id', subjectId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('[v0] Error fetching chapters:', error);
    return [];
  }
  return data || [];
}

// Mock Test Queries
export async function getMockTests(userId: string): Promise<MockTest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('mock_tests')
    .select('*')
    .eq('user_id', userId)
    .order('test_date', { ascending: false });

  if (error) {
    console.error('[v0] Error fetching mock tests:', error);
    return [];
  }
  return data || [];
}

export async function createMockTest(userId: string, mockTestData: Partial<MockTest>): Promise<MockTest | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('mock_tests')
    .insert({
      user_id: userId,
      ...mockTestData,
    })
    .select()
    .single();

  if (error) {
    console.error('[v0] Error creating mock test:', error);
    return null;
  }
  return data;
}

// Notes Queries
export async function getNotes(userId: string): Promise<Note[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[v0] Error fetching notes:', error);
    return [];
  }
  return data || [];
}

export async function createNote(userId: string, noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      ...noteData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[v0] Error creating note:', error);
    return null;
  }
  return data;
}

export async function updateNote(noteId: string, noteData: Partial<Note>): Promise<Note | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notes')
    .update({
      ...noteData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    console.error('[v0] Error updating note:', error);
    return null;
  }
  return data;
}

export async function deleteNote(noteId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    console.error('[v0] Error deleting note:', error);
    return false;
  }
  return true;
}

// PYQ Queries
export async function getPYQs(filters?: {
  exam?: string;
  year?: number;
  subject?: string;
  topic?: string;
  difficulty?: string;
}): Promise<PYQQuestion[]> {
  const supabase = createClient();
  let query = supabase.from('pyq_questions').select('*');

  if (filters?.exam) query = query.eq('exam', filters.exam);
  if (filters?.year) query = query.eq('year', filters.year);
  if (filters?.subject) query = query.eq('subject', filters.subject);
  if (filters?.topic) query = query.eq('topic', filters.topic);
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty);

  const { data, error } = await query.order('year', { ascending: false });

  if (error) {
    console.error('[v0] Error fetching PYQs:', error);
    return [];
  }
  return data || [];
}
