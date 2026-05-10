import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/supabase/seed';

/**
 * POST /api/admin/seed
 * 
 * Seeds the database with master/global data only.
 * 
 * User-specific daily plans must be generated after onboarding and should not
 * be seeded as fixed Day 1 / Day 2 / Day 3 records.
 */
export async function POST(request: NextRequest) {
  try {
    // Check for authorization header (basic protection)
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_SEED_KEY;

    if (!adminKey) {
      return NextResponse.json(
        { error: 'Seed endpoint is not configured' },
        { status: 503 }
      );
    }

    if (authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const seedData = await request.json();

    if (seedData.dailyRoadmap || seedData.dailyPlans || seedData.dailyTasks) {
      return NextResponse.json(
        { error: 'Static daily plan seeding is not allowed. Seed only master data.' },
        { status: 400 }
      );
    }

    if (!seedData.exams && !seedData.subjects && !seedData.chapters && !seedData.pyqQuestions && !seedData.quotes) {
      return NextResponse.json(
        { error: 'Invalid seed data: missing master data fields' },
        { status: 400 }
      );
    }

    const success = await seedDatabase(seedData);

    if (success) {
      return NextResponse.json(
        { 
          message: 'Database seeded successfully',
          data: {
            subjectsSeeded: seedData.subjects?.length || 0,
            examsSeeded: seedData.exams?.length || 0,
            chaptersSeeded: seedData.chapters?.length || 0,
            pyqsSeeded: seedData.pyqQuestions?.length || 0,
          }
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Seeding failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[v0] Seed API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
