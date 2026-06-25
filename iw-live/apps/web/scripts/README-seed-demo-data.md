# Seed Demo Data

This script seeds demo data for testing and demonstration purposes.

## Prerequisites

1. Ensure your database is set up with all required tables (run migrations first)
2. Have database connection credentials ready

## Running the Seed Script

### Using psql

```bash
psql $DATABASE_URL -f scripts/seed-demo-data.sql
```

### Using Supabase CLI

```bash
supabase db execute -f scripts/seed-demo-data.sql
```

### Using a Database Client

Copy and paste the contents of `seed-demo-data.sql` into your database client and execute.

## What Gets Seeded

- **Demo User Profile**: `demo@integratewise.online` with incomplete onboarding
- **Demo Workspace**: A workspace for the demo user
- **Demo Tasks**: 3 sample tasks with different statuses and priorities
- **Demo Notes**: 2 sample notes with tags
- **Demo Health Score**: Sample health metrics for CS lens
- **Demo Goals**: 2 active goals with progress tracking
- **Demo Usage Metrics**: Sample metrics for analytics
- **Demo User Activity**: Activity tracking data
- **Demo NPS Score**: Sample NPS feedback
- **Demo Onboarding State**: Ensures demo users go through onboarding flow

## Demo Login Flow

After seeding:
1. Click "🚀 Try Demo Mode" on the login page
2. You'll be redirected to `/onboarding`
3. Complete the onboarding flow
4. Access the dashboard with seeded demo data

## Notes

- All data uses `demo-user-001` and `demo-workspace-001` as IDs
- The script uses `ON CONFLICT` clauses to be idempotent (safe to run multiple times)
- Demo user's onboarding is set to `false` to ensure they go through the onboarding flow
