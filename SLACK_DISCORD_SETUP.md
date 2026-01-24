# Slack & Discord Integration Setup

## Environment Variables Required

Add these to your Vercel project environment variables:

### Slack
- `SLACK_BOT_TOKEN` - Bot User OAuth Token (xoxb-...)
- `SLACK_SIGNING_SECRET` - Signing secret for webhook verification
- `SLACK_APP_ID` - Your Slack app ID

### Discord
- `DISCORD_BOT_TOKEN` - Bot token from Discord Developer Portal
- `DISCORD_PUBLIC_KEY` - Public key for webhook verification
- `DISCORD_APPLICATION_ID` - Application ID from Discord Developer Portal

---

## Slack Setup

### 1. Create Slack App
1. Go to https://api.slack.com/apps
2. Click "Create New App" > "From scratch"
3. Name it "IntegrateWise OS" and select workspace

### 2. Configure Bot
1. Go to "OAuth & Permissions"
2. Add Bot Token Scopes:
   - `channels:history` - Read channel messages
   - `channels:read` - List channels
   - `chat:write` - Send messages
   - `commands` - Slash commands
   - `users:read` - Read user info
   - `app_mentions:read` - Receive mentions

### 3. Enable Events
1. Go to "Event Subscriptions"
2. Enable Events
3. Set Request URL: `https://your-domain.vercel.app/api/webhooks/slack`
4. Subscribe to bot events:
   - `message.channels`
   - `message.groups`
   - `app_mention`
   - `channel_created`

### 4. Install App
1. Go to "Install App"
2. Click "Install to Workspace"
3. Copy "Bot User OAuth Token"

---

## Discord Setup

### 1. Create Discord Application
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "IntegrateWise OS"

### 2. Create Bot
1. Go to "Bot" section
2. Click "Add Bot"
3. Copy the token
4. Enable "Message Content Intent" under Privileged Gateway Intents

### 3. Configure Interactions
1. Go to "General Information"
2. Copy "Application ID" and "Public Key"
3. Set "Interactions Endpoint URL": `https://your-domain.vercel.app/api/webhooks/discord`

### 4. Add Bot to Server
1. Go to "OAuth2" > "URL Generator"
2. Select scopes: `bot`, `applications.commands`
3. Select bot permissions: `Send Messages`, `Read Message History`, `Use Slash Commands`
4. Copy URL and open in browser to add bot

---

## Webhook Endpoints

| Platform | Endpoint | Events |
|----------|----------|--------|
| Slack | `/api/webhooks/slack` | Messages, mentions, commands |
| Discord | `/api/webhooks/discord` | Messages, interactions, member events |

---

## Data Flow

1. **Messages** → Stored in `brainstorm_chats` for AI analysis
2. **Commands/Mentions** → Create tasks automatically
3. **Member events** → Logged in `data_source_sync`
4. **All events** → Logged in `webhooks` table

---

## Testing

### Slack
Use Slack's Event Subscriptions test feature or post a message in a connected channel.

### Discord
Use Discord's Interactions URL verification or send a message in a connected server.
