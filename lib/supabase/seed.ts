import { createClient } from './client';

export interface SeedData {
  metadata: any;
  phases: any[];
  subjects: any[];
  dailyRoadmap: any[];
  mockTestTemplates: any[];
  pyqSchemaSample: any[];
}

/**
 * Seed the database with initial data from the JSON file
 * This function uses upsert to prevent duplicate errors on re-runs
 */
export async function seedDatabase(data: SeedData) {
  const supabase = createClient();
  
  try {
    console.log('[v0] Starting database seed...');

    // 1. Seed Subjects
    if (data.subjects && data.subjects.length > 0) {
      console.log('[v0] Seeding subjects...');
      for (const subject of data.subjects) {
        const { error } = await supabase
          .from('subjects')
          .upsert(
            {
              id: subject.id,
              name: subject.name,
              icon: subject.icon,
              color: subject.color,
              description: subject.description,
              total_chapters: subject.chapters ? subject.chapters.length : 0,
            },
            { onConflict: 'id' }
          );

        if (error) {
          console.error(`[v0] Error seeding subject ${subject.name}:`, error);
        }

        // Seed chapters for this subject
        if (subject.chapters && subject.chapters.length > 0) {
          console.log(`[v0] Seeding chapters for ${subject.name}...`);
          for (const chapter of subject.chapters) {
            const { error: chapterError } = await supabase
              .from('chapters')
              .upsert(
                {
                  id: chapter.id,
                  subject_id: subject.id,
                  name: chapter.name,
                  order_index: chapter.order,
                  status: chapter.status || 'not_started',
                },
                { onConflict: 'id' }
              );

            if (chapterError) {
              console.error(`[v0] Error seeding chapter ${chapter.name}:`, chapterError);
            }
          }
        }
      }
    }

    // 2. Seed Phases (if included in JSON)
    if (data.phases && data.phases.length > 0) {
      console.log('[v0] Seeding phases...');
      for (const phase of data.phases) {
        const { error } = await supabase
          .from('phases')
          .upsert(
            {
              id: phase.id,
              title: phase.name,
              description: phase.goal,
              phase_number: phase.startDay < 31 ? 1 : phase.startDay < 61 ? 2 : phase.startDay < 91 ? 3 : 4,
              start_day: phase.startDay,
              end_day: phase.endDay,
              focus_areas: [],
            },
            { onConflict: 'id' }
          );

        if (error) {
          console.error(`[v0] Error seeding phase ${phase.name}:`, error);
        }
      }
    }

    // 3. Seed Daily Roadmap (if included)
    if (data.dailyRoadmap && data.dailyRoadmap.length > 0) {
      console.log('[v0] Seeding daily roadmap...');
      for (const dayData of data.dailyRoadmap) {
        // First, seed the roadmap_day
        const { data: roadmapDay, error: roadmapError } = await supabase
          .from('roadmap_days')
          .upsert(
            {
              id: dayData.id,
              day_number: dayData.dayNumber,
              phase_id: dayData.phaseId,
              phase_name: dayData.phaseName,
              title: dayData.title,
              focus: dayData.focus,
              quote: dayData.quote,
            },
            { onConflict: 'id' }
          )
          .select()
          .single();

        if (roadmapError) {
          console.error(`[v0] Error seeding roadmap day ${dayData.dayNumber}:`, roadmapError);
          continue;
        }

        // Then seed the daily tasks for this day
        if (dayData.tasks && dayData.tasks.length > 0) {
          for (const task of dayData.tasks) {
            const { error: taskError } = await supabase
              .from('daily_tasks')
              .upsert(
                {
                  id: task.id,
                  roadmap_day_id: roadmapDay.id,
                  subject: task.subject,
                  title: task.title,
                  description: task.description,
                  estimated_minutes: task.estimatedMinutes,
                  priority: task.priority || 1,
                  type: task.type,
                  resource: task.resource,
                  order_index: task.order,
                },
                { onConflict: 'id' }
              );

            if (taskError) {
              console.error(`[v0] Error seeding task ${task.title}:`, taskError);
            }
          }
        }
      }
    }

    // 4. Seed PYQ Questions (if included)
    if (data.pyqSchemaSample && data.pyqSchemaSample.length > 0) {
      console.log('[v0] Seeding PYQ questions...');
      for (const pyq of data.pyqSchemaSample) {
        const { error } = await supabase
          .from('previous_year_questions')
          .upsert(
            {
              id: pyq.id,
              exam: pyq.exam,
              year: pyq.year,
              subject: pyq.subject,
              topic: pyq.topic,
              difficulty: pyq.difficulty,
              title: pyq.question,
              content: pyq.question,
              options: pyq.options || [],
              correct_answer: pyq.answer,
              explanation: pyq.explanation,
            },
            { onConflict: 'id' }
          );

        if (error) {
          console.error(`[v0] Error seeding PYQ:`, error);
        }
      }
    }

    console.log('[v0] Database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('[v0] Fatal error during seeding:', error);
    return false;
  }
}

/**
 * Create a user profile after signup
 */
export async function createUserProfile(
  userId: string,
  fullName: string,
  examTarget: string,
  dailyStudyHours: number = 3,
  planStartDate: string = new Date().toISOString().split('T')[0]
) {
  const supabase = createClient();

  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: fullName,
      exam_target: examTarget,
      daily_study_hours: dailyStudyHours,
      plan_start_date: planStartDate,
    });

  if (error) {
    console.error('[v0] Error creating user profile:', error);
    return false;
  }

  return true;
}

/**
 * Initialize a user's streak counter
 */
export async function initializeUserStreak(userId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('streaks')
    .insert({
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_completed_date: null,
    });

  if (error) {
    console.error('[v0] Error initializing streak:', error);
    return false;
  }

  return true;
}
