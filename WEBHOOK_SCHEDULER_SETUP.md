# AI Webhook Scheduler Setup

## Overview
The AI Webhook Scheduler automatically analyzes business metrics every hour and sends formatted reports to Slack and Discord channels with AI-generated insights and recommendations.

## Environment Variables Required

Add these to your Vercel project:

```
# AI API Keys (at least one required)
CLAUDE_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...

# Webhook URLs
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Cron Authorization
CRON_SECRET=your-secure-secret
```

## Cron Schedule

The scheduler runs automatically:
- **Hourly**: `/api/cron/hourly-insights` - Full business intelligence report
- **Daily**: `/api/cron/daily-insights` - Brainstorming insights summary at 9 AM

## Report Contents

Each webhook notification includes:

1. **Business Metrics**
   - MRR (Monthly Recurring Revenue)
   - Pipeline Value
   - Health Score
   - Active Clients
   - Open Deals
   - Conversion Rate
   - Average Deal Size

2. **AI-Generated Insights**
   - Business health summary
   - 3 specific recommendations
   - Critical alerts (if any)

3. **ROI Tracking**
   - Connected to deals and products
   - Performance by service tier

## Manual Trigger

Use the dashboard widget or API:

```bash
curl -X POST https://your-domain.com/api/webhook-scheduler/trigger \
  -H "Content-Type: application/json" \
  -d '{"channel": "both"}'
```

Options for `channel`: `"slack"`, `"discord"`, `"both"`

## Database Tables

Run `scripts/026_create_webhook_scheduler.sql` to create:
- `webhook_notifications` - Logs all sent notifications
- `webhook_scheduler_config` - Channel configuration and settings

## Dashboard Widget

The home dashboard includes a Webhook Scheduler widget showing:
- Last webhook sent time
- Recent webhook history (last 5)
- Manual trigger button
- Status indicators (sent/failed)

## Customization

Configure in `webhook_scheduler_config` table:
- `frequency`: hourly, daily, weekly
- `include_metrics`: boolean
- `include_recommendations`: boolean  
- `include_alerts`: boolean
- `alert_threshold_pipeline`: minimum pipeline value
- `alert_threshold_health`: minimum health score for alerts
