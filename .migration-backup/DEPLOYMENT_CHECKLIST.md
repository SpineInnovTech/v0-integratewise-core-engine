# IntegrateWise OS - Deployment Checklist

## Required Environment Variables

### Supabase (Required)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (optional but recommended)

### Authentication
- `NEXT_PUBLIC_MOCK_AUTH` - Set to "true" for demo mode (bypasses auth)
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Development redirect URL for auth

## Optional Environment Variables

### AI Services (one recommended)
- `CLAUDE_API_KEY` - Anthropic Claude API key
- `DEEPSEEK_API_KEY` - DeepSeek API key

### Webhook Integrations
- `SLACK_WEBHOOK_URL` - Slack incoming webhook URL
- `DISCORD_WEBHOOK_URL` - Discord webhook URL
- `WEBHOOK_SCHEDULER_SECRET` - Optional auth for webhook trigger

### Security
- `CRON_SECRET` - Secret for Vercel cron jobs
- `CAPTURE_API_SECRET` - Secret for /api/capture endpoint
- `WEBHOOK_API_SECRET` - Secret for /api/webhook endpoint

### External Integrations
- `HUBSPOT_API_KEY` - HubSpot private app token
- `ASANA_ACCESS_TOKEN` - Asana personal access token

## Database Scripts (Run in Order)

1. `scripts/001_enable_vector_extension.sql` - Enable pgvector
2. `scripts/002_create_interactions_table.sql` - Core interactions
3. `scripts/003_create_documents_table.sql` - Documents with vectors
4. `scripts/008_create_activities_table.sql` - Activity tracking
5. `scripts/010_create_search_function.sql` - Vector search
6. `scripts/014_seed_integratewise_services.sql` - Services data
7. `scripts/017_create_crm_schema.sql` - CRM tables
8. `scripts/018_seed_crm_data.sql` - CRM seed data
9. `scripts/019_create_brainstorming_layer.sql` - Brainstorming
10. `scripts/021_create_strategic_layer.sql` - Strategic hub
11. `scripts/023_create_website_manager.sql` - Website manager
12. `scripts/025_create_slack_discord_tables.sql` - Chat integrations
13. `scripts/026_create_webhook_scheduler.sql` - Webhook scheduler (optional)

## Pre-Deployment Checks

- [ ] All required env vars set in Vercel
- [ ] Supabase project created and connected
- [ ] Database scripts executed successfully
- [ ] Mock auth disabled for production (`NEXT_PUBLIC_MOCK_AUTH=false`)
- [ ] CORS settings configured in Supabase

## Post-Deployment Verification

- [ ] Login page loads correctly
- [ ] Dashboard renders without errors
- [ ] API routes return 200 status
- [ ] Cron jobs execute without errors (check Vercel logs)
- [ ] Webhook endpoints respond correctly

## Common Issues

### "Table does not exist" errors
- Run the corresponding SQL script from the scripts folder

### Authentication redirect loops
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify Supabase Auth settings

### Cron job failures
- Check `CRON_SECRET` is set
- Verify webhook URLs are valid

### Missing service role key warning
- Add `SUPABASE_SERVICE_ROLE_KEY` for full functionality
- System will fall back to anon key if not set
