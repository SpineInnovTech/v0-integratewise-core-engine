# Environment Variables for IntegrateWise OS

## Required
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Cron Jobs
```
CRON_SECRET=your_cron_secret
```

## API Security (Optional - for /api/capture and /api/webhook)
```
CAPTURE_API_SECRET=your_capture_secret
WEBHOOK_API_SECRET=your_webhook_secret
```

## Webhook Providers (Optional)
```
# HubSpot
HUBSPOT_WEBHOOK_SECRET=your_hubspot_secret

# GitHub
GITHUB_WEBHOOK_SECRET=your_github_secret

# Razorpay
RAZORPAY_WEBHOOK_SECRET=your_razorpay_secret

# Vercel
VERCEL_WEBHOOK_SECRET=your_vercel_secret

# Asana
ASANA_WEBHOOK_SECRET=your_asana_secret

# Slack
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Discord
DISCORD_PUBLIC_KEY=your_discord_public_key
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## AI Integration (Optional - at least one for hourly insights)
```
CLAUDE_API_KEY=your_claude_key
DEEPSEEK_API_KEY=your_deepseek_key
OPENAI_API_KEY=your_openai_key
```

## Mock Auth (Development)
```
NEXT_PUBLIC_MOCK_AUTH=true
