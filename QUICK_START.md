# Quick Start: Using the Dynamic Supabase System

## 1. Initial Setup

### Ensure Supabase is Connected
```bash
# Check env vars are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Install Dependencies (if needed)
```bash
npm install
```

## 2. Seed the Database (First Time Only)

### Option A: Using the API Endpoint

```bash
# Get your seed data file ready
# Then call the endpoint:

curl -X POST http://localhost:3000/api/admin/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -d @preptrack-120-day-seed-data.json

# Response:
# {
#   "message": "Database seeded successfully",
#   "data": {
#     "subjectsSeeded": 5,
#     "phasesSeeded": 4,
#     "daysSeeded": 120,
#     "pyqsSeeded": 500
#   }
# }
```

### Option B: Programmatically in Code

```typescript
import { seedDatabase } from '@/lib/supabase/seed'
import seedData from './path/to/preptrack-120-day-seed-data.json'

// Call once at startup or in a utility script
const success = await seedDatabase(seedData)
console.log(success ? 'Seeded!' : 'Failed!')
```

## 3. Run the Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 4. Testing the Dynamic System

### Create a Test Account

1. Go to http://localhost:3000/auth/sign-up
2. Sign up with email and password
3. You'll be redirected to dashboard

### View Dashboard

- **Dashboard** shows:
  - Current day in 120-day plan
  - Real task completion count
  - Daily study hours from profile
  - Average mock test score
  - Weekly progress charts

### Complete Tasks

1. Go to **Daily Tasks** page
2. Click checkbox to mark tasks complete
3. Watch:
   - Progress bar update instantly
   - Completed count increase
   - Toast notification appear
   - Dashboard metrics reflect change

### View Other Sections

- **Subjects** - Shows all subjects and chapters
- **Notes** - Create/edit/delete study notes
- **Roadmap** - View 120-day study plan
- **Mock Tests** - Record test scores

## 5. Key Functions to Use

### In Your React Components

```typescript
import { 
  getUserProfile,
  getRoadmapDay,
  getDailyTasks,
  getTaskCompletions,
  toggleTaskCompletion,
  getMockTests,
  getNotes,
  getPYQs,
} from '@/lib/supabase/queries'

// Example: Load today's tasks
const profile = await getUserProfile(userId)
const currentDay = calculateCurrentDay(profile.plan_start_date)
const roadmapDay = await getRoadmapDay(currentDay)
const tasks = await getDailyTasks(roadmapDay.id)
```

### In Server Components

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
const { data: tasks } = await supabase
  .from('daily_tasks')
  .select('*')
  .eq('roadmap_day_id', dayId)
```

## 6. Common Tasks

### Add a New Feature Using Dynamic Data

1. Identify the data you need
2. Check if query function exists in `lib/supabase/queries.ts`
3. If not, add it following the existing pattern
4. Import and use in your component
5. Handle loading/error states
6. Test thoroughly

### Example: New Progress Chart

```typescript
'use client'
import { useState, useEffect } from 'react'
import { getTaskCompletions } from '@/lib/supabase/queries'

export function ProgressChart({ userId }: { userId: string }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const completions = await getTaskCompletions(userId, [])
      setData(completions)
    }
    load()
  }, [userId])

  if (loading) return <div>Loading...</div>
  return <div>{data.length} tasks completed</div>
}
```

### Create a Note

```typescript
import { createNote } from '@/lib/supabase/queries'
import { toast } from 'sonner'

const handleCreateNote = async (title: string, content: string) => {
  const note = await createNote(user.id, {
    subject: 'Mathematics',
    title,
    content,
    tags: ['algebra', 'important'],
  })

  if (note) {
    toast.success('Note created!')
  } else {
    toast.error('Failed to create note')
  }
}
```

### Record a Mock Test

```typescript
import { createMockTest } from '@/lib/supabase/queries'

const handleSaveScore = async (marks: number, total: number) => {
  const test = await createMockTest(user.id, {
    exam_type: 'SSC CGL',
    marks_obtained: marks,
    total_marks: total,
    test_date: new Date().toISOString().split('T')[0],
  })

  if (test) {
    toast.success('Test score saved!')
  }
}
```

## 7. Debugging

### Check Console Logs

The system logs all database operations with `[v0]` prefix:

```javascript
// Look for these in browser console:
[v0] Error fetching user profile: ...
[v0] Starting database seed...
[v0] Seeding subjects...
```

### Verify Data in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to SQL Editor
4. Run: `SELECT COUNT(*) FROM daily_tasks;`
5. Verify numbers match expectations

### Test API Endpoint

```bash
# Check if seed endpoint works
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-key" \
  -d '{"subjects": [], "phases": []}'

# Should return 400 or 401 depending on auth
```

## 8. Environment Variables

Required for full functionality:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Admin seeding (optional)
ADMIN_SEED_KEY=your-secure-key
```

## 9. Troubleshooting

### "No tasks appear"
- Check database has been seeded
- Verify user's plan_start_date is set correctly
- Check Supabase RLS policies aren't blocking queries

### "Tasks don't save when completed"
- Check browser console for errors
- Verify Supabase connection is working
- Ensure user_id matches authenticated user

### "Dashboard shows no data"
- Verify profile exists in database
- Check plan_start_date is valid
- Run seed to populate roadmap/tasks

### "Seed fails"
- Check JSON file format matches expected structure
- Verify ADMIN_SEED_KEY if using API endpoint
- Look for duplicate IDs in seed data

## 10. Next Steps

1. ✅ Database is seeded
2. ✅ Users can sign up and log in
3. ✅ Dashboard shows real data
4. ✅ Tasks can be marked complete
5. Now:
   - Add more features using query functions
   - Create notes functionality
   - Add mock test tracking
   - Implement PYQ practice
   - Add Groq AI suggestions

## Performance Tips

- Load only what you need (use specific queries)
- Cache results when appropriate
- Show loading states for better UX
- Use pagination for large datasets
- Monitor Supabase logs for slow queries

## Resources

- [DYNAMIC_SYSTEM_GUIDE.md](./DYNAMIC_SYSTEM_GUIDE.md) - Full documentation
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Ready to build!** 🚀
