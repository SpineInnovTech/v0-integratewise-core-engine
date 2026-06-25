## Surface / API Mapping

- `/api/v1/workspace/*` backs User Workbench projections.
- `/api/v1/cognitive/*` backs the Twin Workbench (Cloudflare-native runtime, `iw-agent-runtime`).
- governed approvals, destructive actions, and controlled mutation belong to governance (embedded in Operational Workbench).
- Twin endpoints are not, by themselves, the customer-facing product-shell contract.

---

# IntegrateWise API Reference

## Gateway (port 8786)

All API routes go through the gateway at `/api/v1/*`.

### Authentication

- Header: `Authorization: Bearer <spineDb_jwt>`
- Header: `x-tenant-id: <tenant_uuid>`
- Header: `x-user-id: <user_uuid>`

### Core Endpoints

#### Entity 360

| Method | Path                      | Description              |
| ------ | ------------------------- | ------------------------ |
| GET    | `/api/v1/entity360/:id`   | Get entity 360 view      |
| POST   | `/api/v1/entity360`       | Get with layer selection |
| POST   | `/api/v1/entity360/batch` | Batch multiple entities  |

#### Twin

| Method | Path                              | Description                   |
| ------ | --------------------------------- | ----------------------------- |
| GET    | `/api/v1/cognitive/twin/360/:id`  | Entity 360 + trigger insights |
| POST   | `/api/v1/cognitive/twin/evaluate` | Batch trigger evaluation      |
| GET    | `/api/v1/cognitive/twin/triggers` | List registered triggers      |
| POST   | `/api/v1/cognitive/twin/ask`      | Natural language query        |
| POST   | `/api/v1/cognitive/twin/predict`  | Prediction (renewal/risk)     |

#### Identity Resolution

| Method | Path                                            | Description           |
| ------ | ----------------------------------------------- | --------------------- |
| GET    | `/api/v1/identity/candidates`                   | List merge candidates |
| POST   | `/api/v1/identity/candidates/:id/merge`         | Merge records         |
| POST   | `/api/v1/identity/candidates/:id/keep-separate` | Not duplicates        |
| POST   | `/api/v1/identity/candidates/:id/defer`         | Defer decision        |
| GET    | `/api/v1/identity/stats`                        | Resolution statistics |

#### Workspace

| Method | Path                           | Description           |
| ------ | ------------------------------ | --------------------- |
| GET    | `/api/v1/workspace/entities`   | List entities by type |
| GET    | `/api/v1/workspace/connectors` | List connectors       |

#### Connectors

| Method | Path                                     | Description          |
| ------ | ---------------------------------------- | -------------------- |
| GET    | `/api/v1/connectors/:provider/authorize` | Start OAuth          |
| GET    | `/api/v1/connectors/:provider/callback`  | OAuth callback       |
| GET    | `/api/v1/connectors/stats`               | Connector statistics |

#### Intelligence

| Method | Path                                | Description         |
| ------ | ----------------------------------- | ------------------- |
| GET    | `/api/v1/intelligence/signals`      | Active signals      |
| POST   | `/api/v1/cognitive/think/analyze`   | Manual analysis     |
| GET    | `/api/v1/cognitive/govern/policies` | Governance policies |

#### Knowledge

| Method | Path                          | Description      |
| ------ | ----------------------------- | ---------------- |
| GET    | `/api/v1/knowledge/memories`  | AI memories      |
| GET    | `/api/v1/knowledge/topics`    | Knowledge topics |
| GET    | `/api/v1/knowledge/documents` | Documents        |
| POST   | `/api/v1/knowledge/ingest`    | Ingest content   |

#### Pipeline

| Method | Path                                | Description     |
| ------ | ----------------------------------- | --------------- |
| GET    | `/api/v1/pipeline/status`           | Pipeline status |
| GET    | `/api/v1/cognitive/spine/entities`  | Spine entities  |
| GET    | `/api/v1/cognitive/spine/dashboard` | Dashboard stats |

### Service Ports (Local Dev)

| Service       | Port | Inspector |
| ------------- | ---- | --------- |
| Gateway       | 8786 | 9246      |
| Web App       | 3000 | —         |
| Spine-v2      | 8795 | 9255      |
| Pipeline      | 8794 | 9254      |
| Normalizer    | 8793 | 9253      |
| Knowledge     | 8789 | 9249      |
| Think         | 8798 | 9258      |
| Act           | 8780 | 9240      |
| Govern        | 8787 | 9247      |
| Connector     | 8785 | 9245      |
| Workflow      | 8800 | 9271      |
| Tenants       | 8797 | 9257      |
| Billing       | 8783 | 9243      |
| MCP Connector | 8792 | 9252      |
