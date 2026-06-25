# Python Intelligence Layer

ML/AI backend services for Glowing Pancake.

## Services

### 1. Churn Prediction (ChurnShield Agent)
```python
from agents.churn_shield import ChurnShield

predictor = ChurnShield()
result = predictor.predict(customer_data)
# Returns: churn_probability, risk_factors, recommendations
```

### 2. Health Scoring (SuccessPilot Agent)
```python
from agents.success_pilot import SuccessPilot

scorer = SuccessPilot()
health_score = scorer.calculate_health(account_data)
# Returns: overall_score, component_scores, playbook_triggers
```

### 3. Data Quality (DataSentinel Agent)
```python
from agents.data_sentinel import DataSentinel

sentinel = DataSentinel()
quality_report = sentinel.check_quality(dataset)
# Returns: quality_score, anomalies, recommendations
```

### 4. Architecture Recommendations (ArchitectIQ)
```python
from agents.architect_iq import ArchitectIQ

architect = ArchitectIQ()
recommendation = architect.recommend_integration(requirements)
# Returns: architecture_options, tradeoffs, best_practices
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/analyze/churn` | POST | Churn prediction |
| `/api/v1/analyze/health` | POST | Health scoring |
| `/api/v1/analyze/quality` | POST | Data quality check |
| `/api/v1/analyze/architecture` | POST | Architecture recommendation |
| `/api/v1/generate/template` | POST | Template generation |
| `/api/v1/generate/report` | POST | Report generation |

## Deployment

### Option 1: Cloudflare Workers (Python)
```bash
# Deploy Python Worker
npx wrangler deploy workers/analyze.py
```

### Option 2: Vercel Serverless
```bash
# Deploy to Vercel
vercel --prod
```

### Option 3: Fly.io (Recommended)
```bash
# Deploy container
fly deploy
```

## Environment Variables

```
SUPABASE_URL=
SUPABASE_KEY=
NEON_DATABASE_URL=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
N8N_WEBHOOK_URL=
```

## Integration with n8n

Python services are called via n8n HTTP nodes:

1. n8n workflow receives MCP request
2. HTTP node calls Python API
3. Python processes, returns result
4. n8n returns to MCP client

## Testing

```bash
# Run tests
pytest tests/

# Test churn prediction
curl -X POST http://localhost:8000/api/v1/analyze/churn \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "123", "usage_data": {}}'
```
