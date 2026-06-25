import React, { useState } from "react";

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-lg relative border border-slate-700">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 bg-slate-700 rounded-md text-slate-300 hover:bg-slate-600 hover:text-white transition-all"
        aria-label="Copy code"
      >
        {copied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>
      <pre className="p-4 text-sm text-slate-200 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const DemoPage: React.FC = () => {
  const now = new Date();
  const sessionId = `session_${Date.now()}`;
  const startedAt = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const endedAt = now.toISOString();

  const payload = {
    tenant_id: "demo-tenant",
    user_id: "user_demo_123",
    provider: "gemini",
    session_id: sessionId,
    started_at: startedAt,
    ended_at: endedAt,
    summary_md:
      "# Design Sync: New Dashboard\n\n**Participants**: Alex (FE), Beth (BE), Charlie (UX)\n\n## Key Decisions\n\n- The main chart will use a time-series view.\n- We will use the new branding colors.\n- API endpoint for stats: `/api/v2/dashboard/stats`\n\n## Action Items\n\n1.  **Alex**: Create initial wireframes.\n2.  **Beth**: Draft the API contract.",
    topics: ["dashboard", "ux", "api-design"],
    attachments: [
      {
        name: "initial-wireframes.pdf",
        gcs_path: `gs://integratewise-kb/demo-tenant/sessions/${sessionId}/attachments/initial-wireframes.pdf`,
      },
      {
        name: "api-contract-draft.json",
        gcs_path: `gs://integratewise-kb/demo-tenant/sessions/${sessionId}/attachments/api-contract-draft.json`,
      },
    ],
    project: "Project Phoenix",
  };

  const curlCommand = `curl -X POST https://knowledge-bank-api-<YOUR_CLOUD_RUN_HASH>.a.run.app/v1/ai/session-end \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">API & Demo Script</h1>

      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">API Endpoint: Ingest Session</h2>
          <p className="text-slate-400 mb-4">
            Use this endpoint to send a completed session summary to the Knowledge Bank. This
            simulates the action of a provider-neutral AI connector after a user's session ends.
          </p>
          <CodeBlock code={curlCommand} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Demo Script</h2>
          <div className="prose prose-invert max-w-none prose-li:my-2 prose-ul:pl-5 prose-ol:pl-5 text-slate-300">
            <ol>
              <li>
                <strong>Show the Inbox:</strong> Explain this is the "firehose" of all incoming
                knowledge. Point out different providers, topics, and the new paperclip icon for
                attachments.
              </li>
              <li>
                <strong>Run the API Call:</strong> Copy the <code>curl</code> command above. Explain
                this simulates an AI provider sending a session summary with attachments. Run it in
                your terminal.
              </li>
              <li>
                <strong>Verify Ingestion:</strong> Return to the "Inbox" page. The new summary (from
                "Project Phoenix") should be at the top, showing 2 attachments. Click it.
              </li>
              <li>
                <strong>Show Attachments:</strong> In the modal, scroll down to the "Attachments"
                section and show the linked files.
              </li>
              <li>
                <strong>Search for Knowledge:</strong> Go to the "Search" page.
                <ul>
                  <li>
                    Search for "dashboard" to find the new summary. Note the attachment icon in the
                    search result.
                  </li>
                  <li>Clear the search and filter by the "api-design" topic.</li>
                </ul>
              </li>
              <li>
                <strong>Explain Topic Sync:</strong> Go to "Topic Config". Explain these topics
                control a background job to re-sync documents with Vertex AI Search, ensuring
                freshness. Show how to create/edit a topic and its cadence.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
