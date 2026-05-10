import { NextRequest, NextResponse } from 'next/server';
import { getMasterSeedData, seedDatabase } from '@/lib/supabase/seed';

export const runtime = 'nodejs';

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

    const seedData = getMasterSeedData();

    if (!seedData.exams && !seedData.subjects && !seedData.chapters && !seedData.quote_bank) {
      return NextResponse.json(
        { error: 'Invalid supabase/master-seed.json: missing master data fields' },
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
            examSubjectsSeeded: seedData.exam_subjects?.length || 0,
            chaptersSeeded: seedData.chapters?.length || 0,
            taskTemplatesSeeded: seedData.task_templates?.length || 0,
            revisionRulesSeeded: seedData.revision_rules?.length || 0,
            mockRulesSeeded: seedData.mock_rules?.length || 0,
            physicalRulesSeeded: seedData.physical_rules?.length || 0,
            quotesSeeded: seedData.quote_bank?.length || 0,
            pyqsSeeded: seedData.pyqQuestions?.length || seedData.pyq_questions?.length || 0,
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
