# Integration Tests for IntegrateWise

This package contains end-to-end (E2E) tests for the three main data flows:

- **Flow A**: Ingestion Pipeline (Raw → Normalize → Spine)
- **Flow B**: Knowledge Processing (Brain → Semantic → Storage)
- **Flow C**: AI Content Triage (AI Content → Triage → Approval → Publishing)

## Test Files

| File                        | Description                               |
| --------------------------- | ----------------------------------------- |
| `src/flows-abc-e2e.test.ts` | Main E2E test suite for Flows A, B, and C |
| `src/stripe.test.ts`        | Stripe integration tests                  |

## Running Tests

### Prerequisites

1. Set up environment variables:

```bash
export GATEWAY_URL="https://your-gateway-url.workers.dev"
export TEST_TENANT_ID="your-test-tenant-id"
export TEST_API_KEY="your-test-api-key"
```

2. Or create a `.env` file in this package directory:

```
GATEWAY_URL=http://localhost:8787
TEST_TENANT_ID=test-tenant-123
TEST_API_KEY=test-api-key
```

### Run All Tests

```bash
# From repo root
pnpm test:integration

# Or from this package
pnpm test
```

### Run Specific Flow Tests

```bash
# Flow A only
pnpm test:flow-a

# Flow B only
pnpm test:flow-b

# Flow C only
pnpm test:flow-c
```

### Run Tests Against Local Development

```bash
# Start local dev server first
pnpm dev

# Then run tests
GATEWAY_URL=http://localhost:8787 pnpm test
```

### Run Tests Against Production

```bash
GATEWAY_URL=https://gateway.integratewise.ai pnpm test
```

## Test Coverage

### Flow A: Ingestion Pipeline

- ✅ Webhook ingestion from HubSpot, Stripe
- ✅ Pipeline normalization
- ✅ Spine storage
- ✅ DLQ routing for failures
- ✅ Pipeline health checks
- ✅ Processing metrics

### Flow B: Knowledge Processing

- ✅ Document ingestion and chunking
- ✅ Embedding creation
- ✅ Semantic search
- ✅ Session memory storage
- ✅ Extraction feedback
- ✅ Reprocessing triggers

### Flow C: AI Content Triage

- ✅ Content submission
- ✅ Auto-approval for high confidence
- ✅ Triage queue routing
- ✅ Manual approve/reject
- ✅ Flow C configuration
- ✅ Daily limits enforcement
- ✅ Entity linking
- ✅ Notifications

### Cross-Flow Integration

- ✅ Flow A → B: Document triggers knowledge processing
- ✅ Flow B → C: AI insights go through triage
- ✅ Flow C → A: Approved content updates Spine

### Error Handling

- ✅ Missing tenant ID
- ✅ Invalid API keys
- ✅ Malformed payloads
- ✅ Large payloads

## Writing New Tests

Example test structure:

```typescript
describe("Feature Name", () => {
  it("should do something", async () => {
    const payload = {
      /* test data */
    };

    const response = await apiRequest("/v1/endpoint", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result).toHaveProperty("expectedField");
  });
});
```

## CI/CD Integration

These tests run in GitHub Actions on:

- Every PR to `main`
- Daily scheduled runs against staging
- Pre-deployment checks against production

## Debugging Failed Tests

1. Check the Gateway logs for errors
2. Verify tenant configuration in database
3. Ensure all services are healthy:
   ```bash
   curl $GATEWAY_URL/v1/health
   ```
4. Run with verbose output:
   ```bash
   DEBUG=true pnpm test
   ```
