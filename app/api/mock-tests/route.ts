import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all mock tests
    const { data, error } = await supabase
      .from('mock_tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('[v0] GET mock-tests error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch mock tests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, totalQuestions, timeLimitMinutes, passingScore } = body;

    const { data, error } = await supabase
      .from('mock_tests')
      .insert({
        title,
        description,
        total_questions: totalQuestions,
        time_limit_minutes: timeLimitMinutes,
        passing_score: passingScore,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('[v0] POST mock-tests error:', err);
    return NextResponse.json(
      { error: 'Failed to create mock test' },
      { status: 500 }
    );
  }
}
