# AGENTS.md

## Project
This is a Next.js + Supabase competitive exam preparation platform.

## Core Product Rule
Do not use hardcoded demo arrays inside UI components.

All UI data must come from:
1. Supabase master seed tables
2. User-generated study plan tables
3. User progress tables

## Planning Logic
The app must support dynamic study plan generation.

User chooses:
- exam target
- target days
- daily study hours
- start date
- maths level
- physical level

The app generates personalized daily tasks and saves them in Supabase.

## Seed Data Rule
Seed only master data:
- exams
- subjects
- chapters
- task templates
- revision rules
- mock rules
- physical rules
- quote bank

Do not seed fixed daily plans as final user plans.

## User Data Rule
User-specific generated data belongs in:
- profiles
- user_study_plans
- user_daily_tasks
- notes
- mock_tests

## PYQ Rule
AI-generated questions are not real PYQs.
Use:
source = "ai_generated"
is_verified = false

Verified previous year paper questions:
source = "verified_pyq"
is_verified = true

## UI Rule
Use:
- shadcn/ui
- Magic UI
- Aceternity UI
- Framer Motion
- Lucide React
- Recharts
- React Hot Toast / Sonner

## Code Quality
- Use TypeScript strictly.
- Keep components reusable.
- Keep database queries in /lib/queries.
- Keep plan generator in /lib/planner.
- Keep Supabase clients in /lib/supabase.
- Add loading, empty, and error states.
- Make UI mobile responsive.
