import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type SeedSubject = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  chapters?: { id?: string; name: string; order?: number; order_index?: number }[];
};

type SeedPhase = {
  id: string;
  name: string;
  startDay?: number;
  endDay?: number;
  start_day?: number;
  end_day?: number;
  goal?: string | null;
};

type SeedTask = {
  id?: string;
  subjectId?: string | null;
  subject_id?: string | null;
  title: string;
  chapter?: string | null;
  task?: string | null;
  howToStudy?: string[];
  how_to_study?: string[];
  estimatedMinutes?: number;
  estimated_minutes?: number;
  priority?: 'low' | 'medium' | 'high';
  order?: number;
  order_index?: number;
};

type SeedDailyPlan = {
  id?: string;
  day?: number;
  dayNumber?: number;
  phaseId?: string | null;
  phase_id?: string | null;
  isRevisionDay?: boolean;
  is_revision_day?: boolean;
  tasks?: SeedTask[];
};

type SeedPYQ = {
  id?: string;
  examId?: string | null;
  exam_id?: string | null;
  year: number;
  subjectId?: string | null;
  subject_id?: string | null;
  chapter?: string | null;
  topic?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard';
  question: string;
  options?: string[];
  answer?: string | null;
  explanation?: string | null;
  source?: string | null;
  frequency?: number;
};

export interface SeedData {
  phases?: SeedPhase[];
  subjects?: SeedSubject[];
  chapters?: Record<string, string[]>;
  dailyRoadmap?: SeedDailyPlan[];
  pyqSchemaSample?: SeedPYQ[];
  quotes?: { quote: string; author?: string | null }[];
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function seedDatabase(data: SeedData) {
  const supabase = createAdminClient();

  try {
    if (data.subjects?.length) {
      for (const subject of data.subjects) {
        const { error } = await supabase
          .from('subjects')
          .upsert(
            {
              id: subject.id,
              name: subject.name,
              icon: subject.icon ?? null,
              color: subject.color ?? null,
            },
            { onConflict: 'id' },
          );

        if (error) throw error;

        const chapterList = subject.chapters?.map(chapter => ({
          id: chapter.id ?? `${subject.id}-${slugify(chapter.name)}`,
          name: chapter.name,
          order_index: chapter.order_index ?? chapter.order ?? 0,
        })) ?? data.chapters?.[subject.id]?.map((name, index) => ({
          id: `${subject.id}-${slugify(name)}`,
          name,
          order_index: index + 1,
        })) ?? [];

        for (const chapter of chapterList) {
          const { error: chapterError } = await supabase
            .from('chapters')
            .upsert(
              {
                id: chapter.id,
                subject_id: subject.id,
                name: chapter.name,
                order_index: chapter.order_index,
              },
              { onConflict: 'id' },
            );

          if (chapterError) throw chapterError;
        }
      }
    }

    if (data.phases?.length) {
      for (const phase of data.phases) {
        const { error } = await supabase
          .from('roadmap_phases')
          .upsert(
            {
              id: phase.id,
              name: phase.name,
              start_day: phase.start_day ?? phase.startDay ?? 1,
              end_day: phase.end_day ?? phase.endDay ?? 1,
              goal: phase.goal ?? null,
            },
            { onConflict: 'id' },
          );

        if (error) throw error;
      }
    }

    if (data.dailyRoadmap?.length) {
      for (const dayData of data.dailyRoadmap) {
        const day = dayData.day ?? dayData.dayNumber ?? 1;
        const planId = dayData.id ?? `day-${day}`;
        const { data: plan, error } = await supabase
          .from('daily_plans')
          .upsert(
            {
              id: planId,
              day,
              phase_id: dayData.phase_id ?? dayData.phaseId ?? null,
              is_revision_day: dayData.is_revision_day ?? dayData.isRevisionDay ?? false,
            },
            { onConflict: 'id' },
          )
          .select('id')
          .single();

        if (error) throw error;

        for (const [index, task] of (dayData.tasks ?? []).entries()) {
          const { error: taskError } = await supabase
            .from('daily_tasks')
            .upsert(
              {
                id: task.id ?? `${plan.id}-task-${index + 1}`,
                daily_plan_id: plan.id,
                subject_id: task.subject_id ?? task.subjectId ?? null,
                title: task.title,
                chapter: task.chapter ?? null,
                task: task.task ?? null,
                how_to_study: task.how_to_study ?? task.howToStudy ?? [],
                estimated_minutes: task.estimated_minutes ?? task.estimatedMinutes ?? 30,
                priority: task.priority ?? 'medium',
                order_index: task.order_index ?? task.order ?? index + 1,
              },
              { onConflict: 'id' },
            );

          if (taskError) throw taskError;
        }
      }
    }

    if (data.pyqSchemaSample?.length) {
      for (const [index, pyq] of data.pyqSchemaSample.entries()) {
        const { error } = await supabase
          .from('pyq_questions')
          .upsert(
            {
              id: pyq.id ?? `pyq-${index + 1}`,
              exam_id: pyq.exam_id ?? pyq.examId ?? null,
              year: pyq.year,
              subject_id: pyq.subject_id ?? pyq.subjectId ?? null,
              chapter: pyq.chapter ?? null,
              topic: pyq.topic ?? null,
              difficulty: pyq.difficulty ?? 'medium',
              question: pyq.question,
              options: pyq.options ?? [],
              answer: pyq.answer ?? null,
              explanation: pyq.explanation ?? null,
              source: pyq.source ?? null,
              is_verified: false,
              frequency: pyq.frequency ?? 1,
            },
            { onConflict: 'id' },
          );

        if (error) throw error;
      }
    }

    if (data.quotes?.length) {
      for (const [index, quote] of data.quotes.entries()) {
        const { error } = await supabase
          .from('motivational_quotes')
          .upsert(
            {
              id: `quote-${index + 1}`,
              quote: quote.quote,
              author: quote.author ?? null,
            },
            { onConflict: 'id' },
          );

        if (error) throw error;
      }
    }

    return true;
  } catch (error) {
    console.error('[v0] Fatal error during seeding:', error);
    return false;
  }
}

export async function createUserProfile(
  userId: string,
  fullName: string,
  examTarget: string,
  dailyStudyHours: number = 3,
  startDate: string = new Date().toISOString().split('T')[0],
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: fullName,
      exam_target: examTarget,
      daily_study_hours: dailyStudyHours,
      start_date: startDate,
    });

  if (error) {
    console.error('[v0] Error creating user profile:', error);
    return false;
  }

  return true;
}
