Got it. Below is the mandatory 7–8 stage pipeline that every incoming payload goes through before it is split into Structured (Spine), Unstructured (Context/Knowledge), and AI Chats (IQ Hub/Memory) — and it applies during onboarding and after onboarding (poll/webhook/file dump).

⸻


flowchart TD

%% =========================================================
%% UNIVERSAL INGEST PIPELINE (7–8 STAGES) BEFORE SPLIT
%% Applies to onboarding + post-onboarding (poll/webhook/upload)
%% =========================================================

subgraph Ingress["Ingress (Any Source)"]
  S1["Tool Event / Poll Batch / Webhook Payload"]
  S2["File Upload (PDF/DOCX/CSV/JSON/Email Export)"]
  S3["AI Chat Capture (MCP / Session Export)"]
end

subgraph Stage1_Analyzer["1) Analyzer (Raw Intake + Fingerprint)"]
  A1["Fingerprint (hash, size, mime, charset, timestamps)"]
  A2["Source Metadata Parse (tool, tenant, user, connector, auth scope)"]
  A3["Envelope Normalize (wrap raw into canonical envelope)"]
end

subgraph Stage2_Classifier["2) Classifier (Type + Domain + Intent)"]
  C1["Detect Data Kind: record|message|document|telemetry|chat|mixed"]
  C2["Detect Domain: sales|cs|support|product|finance|ops|engineering|personal"]
  C3["Detect Sensitivity: pii|contract|financial|security|none"]
  C4["Detect Entity Hints: account/contact/ticket/deal/task/meeting/api/etc"]
end

subgraph Stage3_Filter["3) Filter (Policy + Scope Gate)"]
  F1["RBAC/Policy Gate (tenant, role, allowed domains, allowed sources)"]
  F2["Field Allow/Deny (redaction rules, forbidden fields, masking)"]
  F3["Dedup Gate (idempotency key + fingerprint + source event id)"]
  F4["Rate/Quota Gate (connector limits, ingestion budgets)"]
end

subgraph Stage4_Refiner["4) Refiner (Clean + Segment + Canonical Prep)"]
  R1["Sanity Pre-check (schema sanity, required fields, malformed JSON)"]
  R2["Segmenter (split batch into units: records/messages/files/chunks)"]
  R3["Normalizer-Prep (timestamps normalize, enums map, ids map)"]
  R4["Linker Prep (extract refs: account_id, thread_id, file_id, ticket_id)"]
end

subgraph Stage5_Extractor["5) Extractor (Deep Parse + Dual/Triple Output)"]
  E1["Structured Extract (entities/fields/relationships)"]
  E2["Unstructured Extract (text, bodies, comments, transcripts)"]
  E3["File Extract (OCR/parse -> text; keep original in object store)"]
  E4["AI Chat Extract (session, turns, summaries, candidate memories)"]
end

subgraph Stage6_Validator["6) Validator (Quality + Consistency + Trust)"]
  V1["Schema Validate (types, requireds, constraints)"]
  V2["Cross-Ref Validate (account exists? contact linked? ticket->org?)"]
  V3["Evidence Validate (source pointer exists? file version? message id?)"]
  V4["Confidence/Trust Score (source trust, extraction confidence)"]
end

subgraph Stage7_SplitRouter["7) Split + Router (Final Decision)"]
  SR1["Decision: Structured -> Spine"]
  SR2["Decision: Unstructured -> Context/Knowledge"]
  SR3["Decision: AI Chat -> IQ Hub/Memory"]
  SR4["Decision: Mixed -> multi-write with evidence_refs"]
end

subgraph Stage8_Writers["8) Writers (Stores + Index + Audit)"]
  W1["Spine Writer (SSOT entities + relationships + keys)"]
  W2["Context Writer (notes/messages/free-text + embeddings index)"]
  W3["Knowledge Writer (docs/chunks/semantic index)"]
  W4["IQ Hub Writer (chat sessions + memories + compaction)"]
  W5["Audit Writer (immutable ingest log + provenance + diffs)"]
  W6["Event Bus Publisher (new/updated entities, signals triggers)"]
end

subgraph Stores["Stores (Universal)"]
  SpineDB["Spine DB (Structured SSOT)"]
  ContextDB["Context Store (Unstructured + signals staging)"]
  VectorIndex["Vector/Embeddings Index (Knowledge)"]
  ObjectStore["Object Store (raw files)"]
  MemoryDB["IQ Hub / Memory Store (AI chats)"]
  AuditStore["Audit/Evidence Store"]
  EventBus["Event Bus (async triggers)"]
end

%% -------------------------
%% FLOW: Ingress -> Pipeline
%% -------------------------
S1 --> A1
S2 --> A1
S3 --> A1

A1 --> A2 --> A3 --> C1
C1 --> C2 --> C3 --> C4 --> F1
F1 --> F2 --> F3 --> F4 --> R1
R1 --> R2 --> R3 --> R4 --> E1

%% Extractor parallel outputs
E1 --> V1
E2 --> V1
E3 --> V1
E4 --> V1

V1 --> V2 --> V3 --> V4 --> SR1

%% Split decisions
SR1 --> W1
SR2 --> W2
SR2 --> W3
SR3 --> W4
SR4 --> W1
SR4 --> W2
SR4 --> W3
SR4 --> W4

%% Writers -> stores
W1 --> SpineDB
W2 --> ContextDB
W3 --> VectorIndex
W3 --> ObjectStore
W4 --> MemoryDB
W5 --> AuditStore
W6 --> EventBus

%% Audit + event publishing always happens
SR1 --> W5
SR2 --> W5
SR3 --> W5
SR4 --> W5
W1 --> W6
W2 --> W6
W3 --> W6
W4 --> W6


⸻

What each stage must output (so it’s “specific”)

1) Analyzer outputs
	•	fingerprint_hash, mime, source_tool, tenant_id, user_id, connector_id
	•	canonical envelope:
envelope = { source, received_at, raw_payload_ref, metadata }

2) Classifier outputs
	•	data_kind = record|message|document|telemetry|chat|mixed
	•	domain = sales|cs|support|product|finance|ops|engineering|personal
	•	sensitivity = pii|contract|financial|security|none
	•	entity_hints[] = account, contact, ticket, deal, meeting, task, api...

3) Filter outputs
	•	allowed:boolean, redactions[], dedup_key, quota_ok:boolean

4) Refiner outputs
	•	units[] (each unit is a minimal item)
	•	ref_candidates[] (account_id, message_id, file_id, etc.)

5) Extractor outputs (triple-stream)
	•	structured_entities[] (typed objects + relationships)
	•	unstructured_blobs[] (text bodies + metadata)
	•	files[] (raw store ref + extracted text)
	•	ai_sessions[] (turns, summaries, memory candidates)

6) Validator outputs
	•	validation_errors[]
	•	confidence_score
	•	trust_score (source reliability + extraction reliability)
	•	evidence_refs[] (links back to raw source)

7) Split/Router outputs
	•	write_plan = {spine:true/false, context:true/false, knowledge:true/false, memory:true/false}
	•	plus routing reasons

8) Writers outputs
	•	spine_entity_ids[], context_ids[], chunk_ids[], memory_ids[]
	•	audit_log_id
	•	events_published[]

⸻

“One more service before dumping data” (sanity check)

That is already represented as:
	•	Stage 1 Analyzer (fingerprint + envelope)
	•	Stage 4 Refiner (sanity pre-check)
	•	Stage 6 Validator (schema + cross-ref + evidence)

If you want it as a named service, introduce:

SanityCheckService = Stage 4 + Stage 6 combined
Purpose: block garbage data, malware-ish files, malformed payloads, missing ids, suspicious spikes before any store write.

⸻

If you now want, I’ll map each tool (Slack/Gmail/Notion/Stripe/etc.) into this pipeline with exact “data_kind/domain/entity_hints” defaults so classifier rules are deterministic.