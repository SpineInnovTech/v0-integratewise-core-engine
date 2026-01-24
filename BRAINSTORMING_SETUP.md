# Brainstorming Intelligence Layer Setup

## Overview
The Brainstorming Layer connects `webhooks.integratewise.online` to your IntegrateWise OS, analyzing brainstorming sessions with AI and automatically creating tasks, content, campaigns, and pipeline updates.

## Architecture Flow

```
webhooks.integratewise.online
    ↓ (Hourly loads)
POST /api/webhooks/brainstorm
    ↓
brainstorm_sessions table (Vector DB)
    ↓ (Auto-trigger)
POST /api/brainstorm/analyze
    ↓ (AI Analysis with GPT-4o)
brainstorm_insights table
    ↓ (Auto-execute high-priority)
POST /api/brainstorm/execute
    ↓ (Creates entities)
tasks, documents, content_library, campaigns, deals
```

## Database Tables Created

### 1. `brainstorm_sessions`
Stores all brainstorming data with vector embeddings for semantic search.

### 2. `brainstorm_insights`
AI-generated actionable insights with types:
- **task** → Creates tasks automatically
- **blog_post** → Generates and saves blog content
- **linkedin_post** → Creates LinkedIn posts
- **email_campaign** → Sets up email campaigns
- **pipeline_update** → Creates/updates deals
- **knowledge_article** → Generates knowledge base articles

### 3. `daily_insights`
Daily AI-powered business intelligence summaries.

## Webhook Integration

### Setup on webhooks.integratewise.online

Configure webhook to send brainstorming data:

**Endpoint:** `https://your-domain.vercel.app/api/webhooks/brainstorm`

**Payload format:**
```json
{
  "title": "Session title",
  "description": "Brief description",
  "content": "Full brainstorming content/transcript",
  "participants": ["Nirmal Prince", "Team Member"],
  "session_type": "product",
  "source_url": "https://webhooks.integratewise.online/session/123",
  "metadata": {
    "duration_minutes": 90,
    "platform": "notion"
  }
}
```

**Session Types:**
- `general` - General brainstorming
- `product` - Product ideation
- `marketing` - Marketing campaigns
- `sales` - Sales strategies
- `strategy` - Business strategy

## AI Analysis Process

1. **Receive Webhook** → Brainstorm session stored in database
2. **Trigger Analysis** → AI extracts key insights and actionable items
3. **Generate Insights** → Creates structured records with confidence scores
4. **Auto-Execute** → High-priority/high-confidence actions executed automatically:
   - Priority: `urgent` OR (Priority: `high` AND Confidence: >85%)
   - Creates real entities (tasks, content, deals) in your OS

## What Gets Auto-Created

### Tasks
```sql
INSERT INTO tasks (title, description, priority, status, due_date, assignee, tags)
```

### Knowledge Articles
- AI generates full Markdown articles (800-1200 words)
- Saved to `documents` table
- Categorized and searchable

### Blog Posts
- AI generates SEO-optimized blog content
- Saved to `content_library` as draft
- Ready for review and publishing

### LinkedIn Posts
- Short-form social media content
- Saved to `content_library` with platform='linkedin'

### Email Campaigns
- Campaign outline and copy
- Saved to `campaigns` table as draft

### Pipeline Updates
- Deal opportunities created in `deals` table
- Linked to brainstorming source

## Daily Insights

**Automated Daily Report** (runs at 9 AM via Vercel Cron):
- Summarizes all brainstorming activity
- Tracks actions taken (tasks, content, pipeline)
- Provides priority actions for the day
- Captures metrics snapshot

**View:** `/brainstorming` → "Today's AI Insights" card

## Manual Triggers

### Analyze a Session
```bash
curl -X POST https://your-domain.vercel.app/api/brainstorm/analyze \
  -H "Content-Type: application/json" \
  -d '{"session_id": "uuid-here"}'
```

### Execute an Insight
```bash
curl -X POST https://your-domain.vercel.app/api/brainstorm/execute \
  -H "Content-Type: application/json" \
  -d '{"insight_id": "uuid-here"}'
```

### Generate Daily Insights
```bash
curl -X POST https://your-domain.vercel.app/api/brainstorm/daily-insights
```

## Environment Variables

Add to your Vercel project:

```bash
CRON_SECRET=your-random-secret-key
NEXT_PUBLIC_URL=https://your-domain.vercel.app
```

## UI Views

### `/brainstorming`
- **Today's AI Insights** - Daily summary card
- **Brainstorm Sessions** - All sessions with context/insights
- **AI-Generated Insights** - All actionable items with status

### Session Detail Dialog
- Full context/transcript
- Key insights extracted
- Action items list

## Testing

### 1. Send Test Webhook
```bash
curl -X POST https://your-domain.vercel.app/api/webhooks/brainstorm \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Brainstorm Session",
    "description": "Testing the brainstorming layer",
    "content": "We discussed launching a new product feature. Key ideas: integrate with HubSpot, create marketing campaign, need blog post about benefits.",
    "participants": ["Nirmal Prince"],
    "session_type": "product"
  }'
```

### 2. Check Database
```sql
SELECT * FROM brainstorm_sessions ORDER BY created_at DESC LIMIT 1;
SELECT * FROM brainstorm_insights ORDER BY created_at DESC LIMIT 10;
```

### 3. Verify Auto-Execution
Check if high-priority insights created actual entities:
```sql
SELECT * FROM tasks WHERE tags @> ARRAY['from_brainstorm'];
SELECT * FROM documents WHERE metadata->>'auto_generated' = 'true';
SELECT * FROM content_library WHERE tags @> ARRAY['brainstorm'];
```

## Performance

- **Vector Search:** IVFFlat index for fast similarity search
- **Auto-execution:** Only high-confidence insights (prevents spam)
- **Async Processing:** Analysis runs in background after webhook
- **Daily Batching:** Insights generated once per day (9 AM)

## Monitoring

Track in `/brainstorming` view:
- Total sessions processed
- Insights generated vs executed
- Success rate of auto-actions
- Daily insight summaries

## Next Steps

1. ✅ Run SQL scripts 019-020 to create tables
2. ✅ Deploy to Vercel
3. ⚙️ Configure webhook on webhooks.integratewise.online
4. ⚙️ Set CRON_SECRET in Vercel environment variables
5. 🧪 Send test webhook
6. 📊 Monitor /brainstorming dashboard

---

**Built for:** IntegrateWise Operating System  
**AI Models:** GPT-4o (analysis), GPT-4o-mini (summaries)  
**Vector DB:** pgvector (PostgreSQL extension)
