import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/supabase/seed';

/**
 * POST /api/admin/seed
 * 
 * Seeds the database with initial data from the provided JSON structure
 * This is an admin-only endpoint that should be protected in production
 * 
 * Request body should contain the seed data structure:
 * {
 *   "metadata": {...},
 *   "phases": [...],
 *   "subjects": [...],
 *   "dailyRoadmap": [...],
 *   "mockTestTemplates": [...],
 *   "pyqSchemaSample": [...]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check for authorization header (basic protection)
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_SEED_KEY;

    // If admin key is set, validate it
    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the seed data from request body
    const seedData = await request.json();

    // Validate required fields
    if (!seedData.subjects && !seedData.dailyRoadmap && !seedData.pyqSchemaSample) {
      return NextResponse.json(
        { error: 'Invalid seed data: missing required fields' },
        { status: 400 }
      );
    }

    // Run seeding
    const success = await seedDatabase(seedData);

    if (success) {
      return NextResponse.json(
        { 
          message: 'Database seeded successfully',
          data: {
            subjectsSeeded: seedData.subjects?.length || 0,
            phasesSeeded: seedData.phases?.length || 0,
            daysSeeded: seedData.dailyRoadmap?.length || 0,
            pyqsSeeded: seedData.pyqSchemaSample?.length || 0,
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
