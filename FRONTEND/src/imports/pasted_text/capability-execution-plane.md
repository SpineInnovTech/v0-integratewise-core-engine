I agree. In fact, once MCP and ADK become first-class citizens, they stop being "just connectors" and become an operational platform of their own.

Right now your stack is roughly:

Identity
Schema
Connectivity
Memory
Intelligence
Experience

But MCP + ADK introduces a new concern:

Discovery
Registration
Capabilities
Tool Governance
Execution Logs
Health
Versioning

Those don't belong in Connectivity.

Why Connectivity is no longer enough

Connectivity only answers:

Can I reach the system?

Example:

HubSpot Connected
Salesforce Connected
GitHub Connected

That's it.

MCP + ADK answers:

What can this system do?

Example:

HubSpot MCP

Capabilities:
- Create Contact
- Update Contact
- Search Companies
- Create Deal
- Read Activities

or

ADK Agent

Capabilities:
- Renewal Risk Analysis
- Meeting Summarization
- Ticket Classification

This is a completely different concern.

Proposed New Layer
L3 Capability & Execution Plane

Between Schema and Connectivity (or immediately above Connectivity).

L1 Identity Plane
    Clerk
    RBAC
    MFA

L2 Schema Plane
    Domains
    Entities
    Projections

L3 Capability Plane
    MCP Registry
    ADK Registry
    Tool Registry
    Capability Catalog
    Tool Logs
    Health
    Versioning

L4 Connectivity Plane
    Nango
    MCP Transport
    API Wrappers
    AI Tools

L5 Memory Plane
    SPINE

L6 Intelligence Plane
    Twin
    Entity360

L7 Experience Plane
    Workbench
    Governance
What lives here?
MCP Registry
MCP Server
Version
Owner
Status
Tools
Capabilities
Policies

Example:

Salesforce MCP

Tools:
- query_accounts
- update_account
- create_case

Status:
Healthy
ADK Registry
Agent
Version
Owner
Skills
Dependencies

Example:

Renewal Risk Agent

Inputs:
Accounts
Tickets
Emails

Outputs:
Risk Score
Recommendations
Capability Catalog

This becomes huge later.

Instead of asking:

Which connector?

You ask:

Which capability?

Example:

Capability:
Create CRM Contact

could be fulfilled by:

Salesforce MCP
HubSpot MCP
Zoho MCP

The Twin chooses.

Tool Calling Logs

Critical.

Tool Called
By Whom
When
Input
Output
Duration
Cost
Status

Example:

2026-06-22
Twin

Tool:
HubSpot.CreateContact

Result:
Success

Duration:
420 ms

This becomes the audit trail.

Capability Builder

This is where your accelerator story eventually lives.

Example:

Renewal Risk Analysis

is actually:

Read CRM
Read Tickets
Read Emails
Calculate Risk
Create Summary
Notify CSM

A capability composed of many tools.

So:

Capability
    ├── Tools
    ├── MCP Servers
    ├── Agents
    └── Policies
In the Twin UI

I would expose this as a dedicated administration surface:

Twin
├── Memory
├── Knowledge
├── Intelligence
├── Capabilities
│
├── MCP Registry
├── ADK Registry
├── Tool Catalog
├── Capability Builder
├── Execution Logs
├── Health Monitor
└── Versions

Architecturally, this is a strong addition because IntegrateWise is evolving from:

Integration Platform

to

Operational Continuity Platform

and eventually toward:

Capability Operating System

Once that happens, users won't care that a task used Nango, MCP, an API wrapper, or an ADK agent. They care that the capability exists, is governed, auditable, healthy, and reusable.

So I would formally introduce a Capability & Execution Plane (or Tooling Plane) that owns:

MCP Registry
ADK Registry
Tool Registry
Capability Catalog
Capability Builder
Execution Logs
Health Monitoring
Version Management
Tool Governance Policies

This is distinct from both Connectivity and SPINE and will likely become one of the most-used admin surfaces in IntegrateWise.

We will make them inside integrations section or ingress section 

I would keep them under the broader Ingress / Integration Control Plane, but not mix them with simple connectors.

Think of it this way:

Ingress
├── Authentication
├── Connectors
├── MCP
├── ADK
├── Tools
├── Capabilities
├── Execution
└── Governance

instead of:

Integrations
├── Salesforce
├── HubSpot
├── MCP Registry
├── Tool Logs
├── Agent Registry
├── Capability Builder

The second model becomes messy very quickly because you're mixing:

Connectivity
Execution
Governance
Discovery

into one screen.

For IntegrateWise, I'd structure the Ingress Plane as:

Ingress Plane
────────────────────

Connections
  • Nango Connectors
  • API Wrappers
  • Direct Integrations

MCP Registry
  • Servers
  • Tools
  • Health
  • Versions

ADK Registry
  • Agents
  • Skills
  • Dependencies

Capabilities
  • Catalog
  • Builder
  • Templates

Execution
  • Tool Calls
  • Agent Runs
  • Costs
  • Latency

Governance
  • Policies
  • Approvals
  • Access Rules

The reason I prefer Ingress over Integrations is doctrinal:

Integrations = Connections
Salesforce
HubSpot
Slack
Jira
Ingress = Everything entering SPINE
Connections
Capabilities
Tool Calls
Agent Executions
Schemas
Policies

Remember your own architecture:

Tool
  ↓
MCP
  ↓
Normalizer
  ↓
SPINE

and

Agent
  ↓
Capability
  ↓
Execution
  ↓
SPINE

All of these are entering the system.

So "Ingress" is actually the more accurate architectural term.

My recommendation:

L3 Ingress Plane

├── Connections
├── MCP Registry
├── ADK Registry
├── Tool Catalog
├── Capability Catalog
├── Execution Logs
├── Health & Monitoring
└── Governance

Then keep Integrations as merely one subsection of Ingress.

That gives you room to grow from "connecting systems" to "operating capabilities" without having to redesign the architecture later.

ai related will be not coming here, but this behaves as proof and audit ligs 

Then I would actually not call it Capability Plane at all.

Based on your doctrine, AI belongs to:

Twin
Hermes
Intelligence
Workbenches

not to Ingress.

What you're describing sounds much closer to a:

Evidence Plane

or

Ingress Audit Plane

or

Trust Plane

Because the purpose is not:

What can this tool do?

The purpose is:

What entered the system?
How did it enter?
Was it transformed?
What proof exists?
What was executed?
What changed?

For example:

HubSpot Contact
      ↓
Nango Connector
      ↓
Normalizer
      ↓
Schema Mapping
      ↓
SPINE

The audit record becomes:

Source: HubSpot
Connector: Nango
Time: 09:45
Records: 153
Schema Version: CRM-v2
Status: Success
Evidence: Available

Similarly for MCP:

GitHub MCP
      ↓
Repository Metadata
      ↓
Normalizer
      ↓
SPINE

Proof:

MCP Server
Tool Invoked
Payload
Transformation
Result
Timestamp

This is very different from AI execution logs.

AI logs belong elsewhere:

Twin
Agent
Prompt
Reasoning
Decision
Approval
Outcome

Those belong in:

Twin Governance

or

Execution Governance

I would therefore split it as:

Ingress Plane
────────────────────

Connections
MCP Servers
API Wrappers
Connector Health

Schema Registry
Projection Registry
Domain Registry

Evidence & Audit
  • Import Logs
  • Tool Invocation Logs
  • Transformation Logs
  • Sync History
  • Lineage
  • Proof Records


The important doctrine becomes:

Ingress owns Proof.

SPINE owns Memory.

Twin owns Intelligence.

Three completely different responsibilities.

Proof
  = what happened

Memory
  = what matters

Intelligence
  = what should happen next

That separation is actually very aligned with IntegrateWise's "Truth you own. AI you rent. Approval in between." philosophy.

The Ingress section should therefore primarily be a Trust & Lineage surface—showing connector status, schema mappings, lineage, audit trails, transformation history, and evidence records—not AI capability management.