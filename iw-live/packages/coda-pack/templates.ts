// Shared Coda HTML Templates for IntegrateWise Control Surface

export const TEMPLATES: Record<string, string> = {
  "home.html": `<!-- Title: Home -->
<!-- Icon: 🏠 -->
<!-- CoverImage: https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80 -->

<div>
  <p><i>Welcome to the central operations control surface. This workspace manages the IntegrateWise cognitive nervous system, following the Customer Zero doctrine.</i></p>
  
  <hr />
  
  <!-- Horizontal Navigation Cards Row -->
  <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 24px;">
    <tr>
      <td style="width: 33%; padding: 8px; border: none;">
        <div style="background-color: #ffffff; border: 1px solid #e1e4e6; border-radius: 8px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size: 24px; margin-bottom: 8px;">🏔️</div>
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">Our Mission</h4>
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0;">Understanding our core direction and the "Why".</p>
          <a href="#Mission" style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">View Mission →</a>
        </div>
      </td>
      <td style="width: 33%; padding: 8px; border: none;">
        <div style="background-color: #ffffff; border: 1px solid #e1e4e6; border-radius: 8px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size: 24px; margin-bottom: 8px;">🤝</div>
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">Our Values</h4>
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0;">The cultural bedrock of how we work and build.</p>
          <a href="#Values" style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">View Values →</a>
        </div>
      </td>
      <td style="width: 33%; padding: 8px; border: none;">
        <div style="background-color: #ffffff; border: 1px solid #e1e4e6; border-radius: 8px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size: 24px; margin-bottom: 8px;">🎯</div>
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">Ops & Goals</h4>
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0;">Active integration goals and progress tracking.</p>
          <a href="#Goals" style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">View Goals →</a>
        </div>
      </td>
    </tr>
  </table>

  <h2 style="color: #111827; margin-bottom: 8px;">Workspace Overview</h2>
  <p style="color: #4b5563;">This Coda workspace is directly wired to the IntegrateWise Spine through our custom Pack. Updates to any database will populate here, and actions taken here propagate back to the execution layer.</p>

  <h3 style="color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 24px;">Quick Directory</h3>
  <ul style="line-height: 1.6; color: #4b5563; padding-left: 20px;">
    <li>🏠 <strong>Home</strong>: Current page. Overview and navigation directory.</li>
    <li>📚 <strong>Spine</strong>: The Book of Records and Book of Projects relational database views.</li>
    <li>🧠 <strong>Personal Memory</strong>: Context, preferences, and behavioral signals for active developers.</li>
    <li>🏛️ <strong>Org Memory</strong>: Canonical institutional memory, staging, and approval queues.</li>
    <li>⚙️ <strong>Ops</strong>: Live pipeline metrics, connector statuses, and task flows.</li>
    <li>📈 <strong>Progress</strong>: Service Integration (SI) plan progress, ARR status, and spotlight metrics.</li>
  </ul>
</div>`,

  "mission.html": `<!-- Title: Mission -->
<!-- Icon: 🏔️ -->
<!-- CoverImage: https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80 -->

<div>
  <!-- Prominent Mission Quote Box -->
  <blockquote style="font-size: 20px; line-height: 1.5; color: #1e3a8a; background-color: #eff6ff; border-left: 5px solid #2563eb; padding: 24px; border-radius: 4px; margin: 24px 0; font-style: italic;">
    "To build the cognitive nervous system that integrates, governs, and automates institutional memory across all platforms, making operations self-documenting, self-healing, and self-executing."
  </blockquote>
  
  <h2 style="color: #111827; margin-top: 32px;">Why We Exist</h2>
  <p style="color: #4b5563; line-height: 1.6;">
    Enterprise operations are fundamentally fragmented. Knowledge is stored in Slack threads, email conversations, Jira tickets, and document files. When developers leave, systems change, or new integrations are onboarded, massive cognitive overhead is spent reconstructing context.
  </p>
  <p style="color: #4b5563; line-height: 1.6;">
    IntegrateWise solves this by establishing a <strong>Core Memory Substrate</strong>. By running our own software to operate, monitor, and synchronize our own company, we serve as <i>Customer Zero</i>, proving our cognitive engine and Spine architecture in real-time.
  </p>

  <h3 style="color: #1f2937; margin-top: 24px;">Core Pillars</h3>
  <ol style="line-height: 1.6; color: #4b5563; padding-left: 20px;">
    <li><strong>Universal Intake Membrane (Loader)</strong>: Consume any format, from any connector, without reasoning overhead.</li>
    <li><strong>Eight-Stage Normalization Pipeline</strong>: Pay the cognitive fee once, mapping raw records to unified canonical traits.</li>
    <li><strong>Single Spine Context Substrate</strong>: Formulate the definitive relationship graph between entities across Slack, HubSpot, and GitHub.</li>
    <li><strong>Human-in-the-Loop Governance</strong>: Keep memory secure. All memory writes are staged, scored by our Triage Bot, and approved by human operators before becoming canonical truth.</li>
  </ol>
</div>`,

  "values.html": `<!-- Title: Values -->
<!-- Icon: 🤝 -->
<!-- CoverImage:  -->

<div>
  <p><i>Our values direct how we build the IntegrateWise engine, how we write memory, and how we handle customer data.</i></p>
  
  <hr />

  <!-- Two-Column Layout (Left: Value Cards, Right: Floating Sidebar) -->
  <table style="width: 100%; border-collapse: collapse; border: none;">
    <tr>
      <!-- Left Column: Value Cards -->
      <td style="width: 70%; padding: 0 16px 0 0; border: none; vertical-align: top;">
        
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; color: #111827; display: flex; align-items: center;">
            <span style="font-size: 20px; margin-right: 8px;">👥</span> We Don't Work Alone
          </h3>
          <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
            Our Twin Orchestrator loop matches a human operator with an autonomous digital twin. Collaborative feedback cycles ensure we compounding our operational capabilities, catching mistakes before they reach production.
          </p>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; color: #111827; display: flex; align-items: center;">
            <span style="font-size: 20px; margin-right: 8px;">⚖️</span> Balanced Responsibility
          </h3>
          <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
            We respect boundaries. IntegrateWise compiles dynamic Playbooks (context + tasks) but hands off execution to the customer's own local environment. This local execution boundary prevents cost-prohibitive cloud fees and respects client data isolation.
          </p>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; color: #111827; display: flex; align-items: center;">
            <span style="font-size: 20px; margin-right: 8px;">🛡️</span> Fight Our Own Biases
          </h3>
          <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
            No agent is allowed to write directly to organizational memory without first routing through the Triage Bot queue. We enforce strict multi-stage normalization, confidence scoring, and mandatory human authorization.
          </p>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; color: #111827; display: flex; align-items: center;">
            <span style="font-size: 20px; margin-right: 8px;">💬</span> Honest Words Kindly Delivered
          </h3>
          <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
            Clear, transparent documentation. We make state transitions and logs explicit. If a component fails or hits a boundary, we report the root cause gracefully, ensuring our developers have immediate path to resolve.
          </p>
        </div>

      </td>
      
      <!-- Right Column: Sidebar Navigation Menu -->
      <td style="width: 30%; padding: 0 0 0 16px; border-left: 1px solid #e5e7eb; vertical-align: top;">
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px;">
          <h4 style="margin: 0 0 12px 0; color: #374151; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Quick Jump</h4>
          <ul style="list-style: none; padding: 0; margin: 0; line-height: 2;">
            <li><a href="#Home" style="color: #4b5563; text-decoration: none; font-size: 13px;">🏠 Home Directory</a></li>
            <li><a href="#Mission" style="color: #4b5563; text-decoration: none; font-size: 13px;">🏔️ Mission Statement</a></li>
            <li><a href="#Goals" style="color: #4b5563; text-decoration: none; font-size: 13px;">🎯 Goals & Progress</a></li>
            <li><a href="#Spine" style="color: #4b5563; text-decoration: none; font-size: 13px;">📚 Spine Records</a></li>
          </ul>
        </div>
      </td>
    </tr>
  </table>
</div>`,

  "goals.html": `<!-- Title: Goals -->
<!-- Icon: 🎯 -->
<!-- CoverImage: https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=1200&q=80 -->

<div>
  <p><i>The strategic objectives and engineering roadmaps of the IntegrateWise platform.</i></p>
  
  <hr />

  <!-- Sub-page Navigation Cards -->
  <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 24px;">
    <tr>
      <td style="width: 50%; padding: 8px; border: none;">
        <div style="background-color: #ffffff; border: 1px solid #e1e4e6; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 8px;">🚀</div>
          <h4 style="margin: 0 0 4px 0; color: #1f2937;">Quarterly Goals</h4>
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0;">Our active 5 Connection Integration plan.</p>
          <a href="#Quarterly Goals" style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">View Quarterly Goals →</a>
        </div>
      </td>
      <td style="width: 50%; padding: 8px; border: none;">
        <div style="background-color: #ffffff; border: 1px solid #e1e4e6; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 8px;">👥</div>
          <h4 style="margin: 0 0 4px 0; color: #1f2937;">Departments / Teams</h4>
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0;">Shared context and team hub definitions.</p>
          <a href="#Teams" style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">View Team Hubs →</a>
        </div>
      </td>
    </tr>
  </table>

  <!-- Two-Column Layout -->
  <table style="width: 100%; border-collapse: collapse; border: none;">
    <tr>
      <!-- Left Column: Annual Roadmap -->
      <td style="width: 70%; padding: 0 16px 0 0; border: none; vertical-align: top;">
        <h2 style="color: #111827; margin-top: 0;">Annual Objectives (2026)</h2>
        
        <ul style="list-style: none; padding: 0; line-height: 1.8; color: #4b5563;">
          <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
            <span style="position: absolute; left: 0;">📌</span>
            <strong>Complete the 5 Service Connections</strong>: Bridge the file memory vault, folder monitors, continuity edge nodes, operations board, and brand docs publication pipelines.
          </li>
          <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
            <span style="position: absolute; left: 0;">📌</span>
            <strong>Become Customer Zero</strong>: Operationalize the monorepo to run entirely on the local macOS and Cloudflare Edge runtime.
          </li>
          <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
            <span style="position: absolute; left: 0;">📌</span>
            <strong>Establish Cognitive Dual-Write Consistency</strong>: Keep the file-system memory vault in sync with pgvector org_memory databases.
          </li>
        </ul>
      </td>
      
      <!-- Right Column: Navigation Sidebar -->
      <td style="width: 30%; padding: 0 0 0 16px; border-left: 1px solid #e5e7eb; vertical-align: top;">
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px;">
          <h4 style="margin: 0 0 12px 0; color: #374151; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Roadmap Quick Links</h4>
          <ul style="list-style: none; padding: 0; margin: 0; line-height: 2;">
            <li><a href="#Quarterly Goals" style="color: #4b5563; text-decoration: none; font-size: 13px;">🚀 Active Connections SI Plan</a></li>
            <li><a href="#Progress" style="color: #4b5563; text-decoration: none; font-size: 13px;">📈 Progress & Metrics</a></li>
            <li><a href="#Ops" style="color: #4b5563; text-decoration: none; font-size: 13px;">⚙️ Pipeline Status</a></li>
          </ul>
        </div>
      </td>
    </tr>
  </table>
</div>`,

  "quarterly_goals.html": `<!-- Title: Quarterly Goals -->
<!-- Icon: 🚀 -->
<!-- CoverImage: https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200&q=80 -->

<div>
  <h2 style="color: #111827; margin-top: 0;">Service Integration (SI) Plan — Active Connections</h2>
  <p style="color: #4b5563; line-height: 1.6;">
    This table manages the development status of the 5 integration points required for our bridge phase. Kiro and the Ops Agent sync live statuses directly to this view.
  </p>

  <!-- SI Plan Table -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-family: sans-serif; font-size: 14px;">
    <thead>
      <tr style="background-color: #f3f4f6; text-align: left; border-bottom: 2px solid #e5e7eb;">
        <th style="padding: 12px 8px; font-weight: 600; color: #374151;">Connection</th>
        <th style="padding: 12px 8px; font-weight: 600; color: #374151;">Component</th>
        <th style="padding: 12px 8px; font-weight: 600; color: #374151;">Status</th>
        <th style="padding: 12px 8px; font-weight: 600; color: #374151;">Owner</th>
        <th style="padding: 12px 8px; font-weight: 600; color: #374151;">Goal / Target</th>
      </tr>
    </thead>
    <tbody>
      {{SI_PLAN_ROWS}}
    </tbody>
  </table>

  <h3 style="color: #1f2937; margin-top: 32px;">Connection Descriptions</h3>
  <ul style="line-height: 1.8; color: #4b5563; padding-left: 20px;">
    <li><strong>Connection 1: Memory → Live</strong>: Build the <code>packages/connectors/memory-repo</code> bridge to push filesystem vault promotions directly to our Neon knowledge documents database.</li>
    <li><strong>Connection 2: Folder Monitor → Live</strong>: Deploy the macOS file monitor tool using <code>chokidar</code>, pushing events directly to Cloudflare Queues through <code>webhook-ingress</code> and the <code>pipeline</code> service.</li>
    <li><strong>Connection 3: CouchDB → Supabase</strong>: Rewrite <code>continuity</code> and <code>intelligence</code> services to deprecate CouchDB and use <code>conversational_memory</code>, <code>org_memory</code>, and <code>personal_memory</code> tables in Supabase.</li>
    <li><strong>Connection 4: Live → integratewise-ops</strong>: Wire the gateway REST API to the Vue3 operations control board.</li>
    <li><strong>Connection 5: Live → BrandDoc</strong>: Establish the publication pipeline to transform approved org memory records and publish them to <code>integratewise-docs</code> via GitHub API.</li>
  </ul>
</div>`,

  "progress.html": `<!-- Title: Progress -->
<!-- Icon: 📈 -->
<!-- CoverImage: https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80 -->

<div>
  <p><i>Real-time status indicators and project completion metrics for the current integration sprint.</i></p>
  
  <hr />

  <!-- Spotlight Metric Cards Row -->
  <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 24px;">
    <tr>
      <td style="width: 33%; padding: 8px; border: none;">
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
          <h4 style="margin: 0 0 8px 0; color: #6b7280; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Active Connections</h4>
          <h2 style="margin: 0; color: #111827; font-size: 28px; font-weight: bold;">{{ACTIVE_CONNECTIONS_COUNT}} / 5</h2>
          <div style="font-size: 12px; color: #10b981; margin-top: 4px; font-weight: bold;">{{COMPLETION_PERCENTAGE}}% Complete</div>
        </div>
      </td>
      <td style="width: 33%; padding: 8px; border: none;">
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
          <h4 style="margin: 0 0 8px 0; color: #6b7280; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">DB Sync Health</h4>
          <h2 style="margin: 0; color: #111827; font-size: 28px; font-weight: bold;">{{DB_SYNC_HEALTH}}</h2>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Supabase ↔ Vault</div>
        </div>
      </td>
      <td style="width: 33%; padding: 8px; border: none;">
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
          <h4 style="margin: 0 0 8px 0; color: #6b7280; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Success Rate</h4>
          <h2 style="margin: 0; color: #111827; font-size: 28px; font-weight: bold;">{{SUCCESS_RATE}}%</h2>
          <div style="font-size: 12px; color: #10b981; margin-top: 4px; font-weight: bold;">Pipeline Operational</div>
        </div>
      </td>
    </tr>
  </table>

  <h3 style="color: #1f2937; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">Key Milestones</h3>
  <ul style="line-height: 1.8; color: #4b5563; padding-left: 20px;">
    <li>✅ <strong>Doctrine Lock</strong>: Architecture version 3.6 consolidated and signed off.</li>
    <li>✅ <strong>MCP Server Registration</strong>: Gateway API-MCP bridge verified and running with 16 tools.</li>
    <li>🏃 <strong>CouchDB Migration</strong>: Session memory rewrites to Supabase in progress (Connection 3).</li>
    <li>📅 <strong>Ops Board Connection</strong>: Gateway proposals queue projection setup (Connection 4).</li>
  </ul>
</div>`,

  "generic_team.html": `<!-- Title: Team Page -->
<!-- Icon: 👥 -->
<!-- CoverImage: https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80 -->

<div>
  <h2 style="color: #111827; margin-top: 0;">{{TEAM_NAME}} Hub</h2>
  <p style="color: #4b5563; line-height: 1.6;"><i>{{TEAM_DESCRIPTION}}</i></p>
  
  <hr />

  <!-- Two-Column Layout -->
  <table style="width: 100%; border-collapse: collapse; border: none;">
    <tr>
      <!-- Left Column: Guidelines & Tasks -->
      <td style="width: 70%; padding: 0 16px 0 0; border: none; vertical-align: top;">
        <h3 style="color: #1f2937; margin-top: 0;">Core Responsibilities</h3>
        <p style="color: #4b5563; line-height: 1.6;">{{TEAM_RESPONSIBILITIES}}</p>

        <h3 style="color: #1f2937; margin-top: 24px;">Getting Started / Runbooks</h3>
        <ul style="line-height: 1.8; color: #4b5563; padding-left: 20px;">
          <li>📖 Read the <a href="#Mission" style="color: #2563eb; text-decoration: none;">Mission Statement</a> to align on core doctrine.</li>
          <li>🔧 Consult local scripts under <code>scripts/</code> or worker configurations in <code>services/</code>.</li>
          <li>💬 Join the <code>#ops-engine</code> channel to coordinate with Triage Bot outputs.</li>
        </ul>
      </td>
      
      <!-- Right Column: Team Metadata Sidebar -->
      <td style="width: 30%; padding: 0 0 0 16px; border-left: 1px solid #e5e7eb; vertical-align: top;">
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #374151; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Team Info</h4>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #4b5563;"><strong>Owner:</strong> {{TEAM_OWNER}}</p>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #4b5563;"><strong>Status:</strong> <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background-color: #def7ec; color: #03543f;">{{TEAM_STATUS}}</span></p>
        </div>
        
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #374151; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Quick Resources</h4>
          <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
            <li><a href="#Home" style="color: #4b5563; text-decoration: none; font-size: 13px;">🏠 Home Directory</a></li>
            <li><a href="#Quarterly Goals" style="color: #4b5563; text-decoration: none; font-size: 13px;">🚀 Active SI Plan</a></li>
          </ul>
        </div>
      </td>
    </tr>
  </table>
</div>`,

  "admin.html": `<!-- Title: Admin -->
<!-- Icon: 📋 -->
<!-- CoverImage: https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80 -->

<div>
  <h2 style="color: #111827; margin-top: 0;">Administration & Governance</h2>
  <p style="color: #4b5563; line-height: 1.6;">
    Manage system configuration, view active pipeline secrets, audit logs, and monitor Triage Bot state.
  </p>

  <hr />

  <h3 style="color: #1f2937; margin-top: 24px;">🔑 Local Secrets & Credentials Status</h3>
  <p style="color: #6b7280; font-size: 13px; margin-bottom: 12px;">
    These keys are loaded locally from your gitignored <code>.iw/secrets.json</code> file or <code>.env</code> file. Plaintext values are never written to Coda or logged.
  </p>

  <!-- Secrets Table -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-family: sans-serif; font-size: 14px;">
    <thead>
      <tr style="background-color: #f3f4f6; text-align: left; border-bottom: 2px solid #e5e7eb;">
        <th style="padding: 12px 8px; font-weight: 600; color: #374151;">Secret Key</th>
        <th style="padding: 12px 8px; font-weight: 600; color: #374151;">Status</th>
        <th style="padding: 12px 8px; font-weight: 600; color: #374151;">Masked Value</th>
        <th style="padding: 12px 8px; font-weight: 600; color: #374151;">Source</th>
      </tr>
    </thead>
    <tbody>
      {{SECRETS_TABLE_ROWS}}
    </tbody>
  </table>

  <h3 style="color: #1f2937; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">Pipeline & Triage Logs</h3>
  <ul style="line-height: 1.8; color: #4b5563; padding-left: 20px;">
    <li><strong>Triage Bot Mode</strong>: Governance Active (HITL required for org_memory writes).</li>
    <li><strong>Spine Dual-Write</strong>: Enabled (Relational Supabase + Offline Vault Sync).</li>
  </ul>
</div>`,
};
