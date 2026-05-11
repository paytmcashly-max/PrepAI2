# Dynamic Supabase System Guide

## Overview

This guide explains how the PrepTrack application has been converted from a hardcoded static UI to a fully dynamic Supabase-powered system.

## Architecture

### Key Changes

1. **Removed All Hardcoded Data**
   - Dashboard chart data (replaced with real Supabase queries)
   - Sample tasks (now loaded from `tasks` table)
   - Hardcoded subjects/chapters (now from `subjects` and `chapters` tables)
   - Mock test statistics (calculated from `mock_tests` table)

2. **New Supabase Query Layer**
   - Created `lib/supabase/queries.ts` with reusable query functions
   - Centralized database operations with proper error handling
   - Type-safe interfaces for all data models

3. **Dynamic Data Flow**
   - User profile determines current day in 120-day plan
   - Tasks load based on current day's roadmap
   - Progress calculated from actual task completions
   - All charts/stats driven by real database data

## File Structure

```
lib/supabase/
├── client.ts          # Supabase client initialization
├── server.ts          # Server-side client with service role
├── proxy.ts           # Middleware proxy for session management
├── queries.ts         # Reusable query functions (NEW)
└── seed.ts            # Database seeding utilities (NEW)

app/api/admin/
└── seed/
    └── route.ts       # API endpoint to trigger seeding (NEW)

app/dashboard/
├── page.tsx           # Updated: Now uses dynamic data
├── tasks/
│   └── page.tsx       # Updated: Loads real tasks, supports marking complete
├── notes/
│   └── page.tsx       # Updated: Loads user notes
├── subjects/
│   └── page.tsx       # Updated: Loads subjects and chapters
└── ... (other pages follow same pattern)
```

## Key Database Tables

### 1. Profiles
Stores user information and exam preparation details
```sql
id, user_id, full_name, exam_target, daily_study_hours, plan_start_date, created_at
```

### 2. Roadmaps
120-day study plans with phases
```sql
id, user_id, title, exam_type, description, start_date, end_date, total_days, created_at
```

### 3. Roadmap Days (dailyRoadmap in JSON)
Individual day in the roadmap
```sql
id, day_number, phase_id, phase_name, title, focus, quote
```

### 4. Daily Tasks
Tasks for each day
```sql
id, roadmap_day_id, subject, title, description, estimated_minutes, priority, type, resource, order_index
```

### 5. Task Completions
User's completion status for tasks
```sql
id, user_id, task_id, completed, completed_at
```

### 6. Subjects
Subject areas (Maths, GK, Hindi, etc.)
```sql
id, name, icon, color, description, total_chapters
```

### 7. Chapters
Chapters within each subject
```sql
id, subject_id, name, order_index, status
```

### 8. Mock Tests
User's mock test scores
```sql
id, user_id, exam_type, marks_obtained, total_marks, weak_areas, mistakes, test_date
```

### 9. Notes
User's study notes
```sql
id, user_id, subject, title, content, tags, created_at, updated_at
```

### 10. Previous Year Questions (PYQs)
Historical exam questions
```sql
id, exam, year, subject, topic, difficulty, question, options_json, correct_answer, explanation, source, verified
```

### 11. Streaks
User's study streak tracking
```sql
id, user_id, current_streak, longest_streak, last_completed_date, created_at, updated_at
```

### 12. Phases
Study phases (Foundation, Core, Practice, Revision)
```sql
id, title, description, phase_number, start_day, end_day, focus_areas
```

## Core Query Functions

### User Profile
```typescript
getUserProfile(userId: string): Promise<UserProfile | null>
calculateCurrentDay(planStartDate: string): number
```

### Tasks
```typescript
getRoadmapDay(dayNumber: number): Promise<RoadmapDay | null>
getDailyTasks(roadmapDayId: string): Promise<DailyTask[]>
getTaskCompletions(userId: string, taskIds: string[]): Promise<TaskCompletion[]>
toggleTaskCompletion(userId: string, taskId: string, completed: boolean): Promise<boolean>
```

### Subjects
```typescript
getSubjects(): Promise<Subject[]>
getChaptersBySubject(subjectId: string): Promise<Chapter[]>
```

### Mock Tests
```typescript
getMockTests(userId: string): Promise<MockTest[]>
createMockTest(userId: string, mockTestData: Partial<MockTest>): Promise<MockTest | null>
```

### Notes
```typescript
getNotes(userId: string): Promise<Note[]>
createNote(userId: string, noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note | null>
updateNote(noteId: string, noteData: Partial<Note>): Promise<Note | null>
deleteNote(noteId: string): Promise<boolean>
```

### PYQ Questions
```typescript
getPYQs(filters?: {
  exam?: string;
  year?: number;
  subject?: string;
  topic?: string;
  difficulty?: string;
}): Promise<PYQQuestion[]>
```

## Seeding the Database

### Option 1: Using the Seed API Endpoint

```bash
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -d @preptrack-120-day-seed-data.json
```

### Option 2: Programmatically in Your Code

```typescript
import { seedDatabase } from '@/lib/supabase/seed';
import seedData from '@/path/to/seed-data.json';

const success = await seedDatabase(seedData);
```

### Option 3: Manual Database Population

Load the seed JSON file and use Supabase dashboard to directly insert records.

## Dashboard Page (Example Implementation)

**Before (Hardcoded):**
```typescript
const streakData = [
  { day: 'Mon', tasks: 5 },
  { day: 'Tue', tasks: 4 },
  // ... hardcoded 7 days
]
```

**After (Dynamic):**
```typescript
// Fetch real data from Supabase
const profile = await getUserProfile(user.id)
const currentDay = calculateCurrentDay(profile.plan_start_date)
const roadmapDay = await getRoadmapDay(currentDay)
const dailyTasks = await getDailyTasks(roadmapDay.id)
const completions = await getTaskCompletions(user.id, taskIds)

// Use in JSX
{completions.map(c => {
  // Render based on real data
})}
```

## Tasks Page (Example Implementation)

**Key Features:**
1. Loads current day's tasks on page load
2. Fetches task completion status
3. Supports real-time task completion toggle
4. Shows toast notifications on success/error
5. Calculates progress from actual completions

**Toggle Task Completion:**
```typescript
const handleTaskToggle = async (taskId: string) => {
  const isCompleted = !completions[taskId]
  const success = await toggleTaskCompletion(user.id, taskId, isCompleted)
  
  if (success) {
    setCompletions(prev => ({
      ...prev,
      [taskId]: isCompleted
    }))
    toast.success(isCompleted ? 'Task completed!' : 'Task marked incomplete')
  }
}
```

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only view/edit their own data
- Select, Insert, Update, Delete policies for each table
- Service role can bypass RLS for admin operations

Example RLS policy:
```sql
CREATE POLICY "Users can view their own tasks"
ON task_completions
FOR SELECT
USING (auth.uid() = user_id);
```

## Environment Variables

Required for Supabase connection:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SEED_KEY=your-secure-admin-key (for seeding)
```

## Migration Path

If you have existing hardcoded components:

1. **Identify hardcoded data** (look for static arrays/objects)
2. **Create a query function** in `lib/supabase/queries.ts`
3. **Update component state** to use the query result
4. **Add loading/error states** for better UX
5. **Replace hardcoded rendering** with dynamic JSX
6. **Add type safety** with TypeScript interfaces

## Performance Optimizations

1. **Query Caching**: Use SWR or React Query for client-side caching
2. **Batch Queries**: Combine multiple queries when possible
3. **Indexes**: Database indexes on frequently filtered columns
4. **RLS**: Efficient policies that filter data server-side
5. **Pagination**: Implement for large datasets

## Future Enhancements

### Groq AI Integration (Placeholder)
- PYQ generation from topics
- Study recommendations based on weak areas
- AI-powered note summaries

### Real-time Updates
- Subscriptions for live task updates
- Collaborative features
- Push notifications

### Analytics
- Weekly performance trends
- Subject strength analysis
- Time-based productivity patterns

## Troubleshooting

### Queries Return No Data
1. Check RLS policies are correctly set
2. Verify user_id matches authenticated user
3. Ensure data was seeded properly

### Seeding Fails
1. Check Supabase connection
2. Verify JSON structure matches expected format
3. Look for duplicate ID conflicts
4. Use `onConflict: 'id'` for upsert behavior

### Performance Issues
1. Check for N+1 query problems
2. Verify indexes exist on filtered columns
3. Use database query profiler
4. Consider pagination for large datasets

## Deployment Notes

For Vercel deployment:
1. Set all env vars in Vercel project settings
2. Seed data before going live (one-time operation)
3. Use ADMIN_SEED_KEY for protection
4. Monitor database performance in Supabase dashboard
5. Set appropriate RLS policies for production

## Support & Resources

- Supabase Docs: https://supabase.com/docs
- Next.js Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components
- TypeScript: https://www.typescriptlang.org/docs/
