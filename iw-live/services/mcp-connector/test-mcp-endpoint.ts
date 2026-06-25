/**
 * Test script to verify AI systems can send data to MCP endpoint
 * and test Knowledge Bank integration
 */

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:8787";
const TEST_TOKEN = process.env.TEST_TOKEN || "Bearer test-token";

interface TestResult {
  test: string;
  status: "PASS" | "FAIL";
  message: string;
  response?: unknown;
}

const results: TestResult[] = [];

/**
 * Test tool discovery endpoint
 */
async function testToolDiscovery(): Promise<TestResult> {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/mcp/tools`);
    const data = await response.json();

    if (response.ok && data.tools && data.tools.length === 7) {
      return {
        test: "Tool Discovery",
        status: "PASS",
        message: `Found ${data.tools.length} tools`,
        response: {
          name: data.name,
          version: data.version,
          toolCount: data.tools.length,
        },
      };
    } else {
      return {
        test: "Tool Discovery",
        status: "FAIL",
        message: `Expected 7 tools, got ${data.tools?.length || 0}`,
        response: data,
      };
    }
  } catch (error) {
    return {
      test: "Tool Discovery",
      status: "FAIL",
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Test writing a session summary (simulating AI completion event)
 */
async function testWriteSessionSummary(): Promise<TestResult> {
  try {
    const sessionId = `test_session_${Date.now()}`;
    const requestBody = {
      request_id: `req_${Date.now()}`,
      actor: {
        tenant_id: "test_tenant",
        user_id: "test_user",
        roles: ["Member"],
      },
      tool: {
        name: "kb.write_session_summary",
        arguments: {
          tenant_id: "test_tenant",
          user_id: "test_user",
          provider: "claude",
          session_id: sessionId,
          started_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
          ended_at: new Date().toISOString(),
          summary_md: `# Session Summary\n\nThis is a test session summary from an AI completion.\n\n## Topics Discussed\n- Testing MCP endpoint\n- Knowledge Bank integration\n- Session management\n\n## Key Points\n- Endpoint is working\n- Data can be written\n- Idempotency is enforced`,
          topics: ["testing", "mcp", "knowledge-bank"],
          project: "test-project",
        },
      },
    };

    const response = await fetch(`${MCP_SERVER_URL}/mcp/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: TEST_TOKEN,
        "Idempotency-Key": `test_${sessionId}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok && data.status === "ok" && data.result?.artifact_id) {
      return {
        test: "Write Session Summary",
        status: "PASS",
        message: `Successfully wrote session summary. Artifact ID: ${data.result.artifact_id}`,
        response: data.result,
      };
    } else {
      return {
        test: "Write Session Summary",
        status: "FAIL",
        message: `Status: ${data.status}, Error: ${data.error?.message || "Unknown error"}`,
        response: data,
      };
    }
  } catch (error) {
    return {
      test: "Write Session Summary",
      status: "FAIL",
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Test idempotency - same session_id should return same artifact_id
 */
async function testIdempotency(): Promise<TestResult> {
  try {
    const sessionId = `idempotent_test_${Date.now()}`;
    const requestBody = {
      request_id: `req_${Date.now()}`,
      actor: {
        tenant_id: "test_tenant",
        user_id: "test_user",
        roles: ["Member"],
      },
      tool: {
        name: "kb.write_session_summary",
        arguments: {
          tenant_id: "test_tenant",
          user_id: "test_user",
          provider: "claude",
          session_id: sessionId,
          started_at: new Date(Date.now() - 1800000).toISOString(),
          ended_at: new Date().toISOString(),
          summary_md: "# Test Session\n\nThis should be idempotent.",
          topics: ["testing"],
        },
      },
    };

    // First call
    const response1 = await fetch(`${MCP_SERVER_URL}/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: TEST_TOKEN,
      },
      body: JSON.stringify(requestBody),
    });

    const data1 = await response1.json();
    const artifactId1 = data1.result?.artifact_id;

    // Second call with same session_id
    requestBody.request_id = `req_${Date.now() + 1}`;
    const response2 = await fetch(`${MCP_SERVER_URL}/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: TEST_TOKEN,
      },
      body: JSON.stringify(requestBody),
    });

    const data2 = await response2.json();
    const artifactId2 = data2.result?.artifact_id;

    if (artifactId1 && artifactId2 && artifactId1 === artifactId2) {
      return {
        test: "Idempotency",
        status: "PASS",
        message: `Idempotency working: same artifact_id (${artifactId1}) returned`,
        response: { artifactId1, artifactId2 },
      };
    } else {
      return {
        test: "Idempotency",
        status: "FAIL",
        message: `Idempotency failed: ${artifactId1} !== ${artifactId2}`,
        response: { artifactId1, artifactId2 },
      };
    }
  } catch (error) {
    return {
      test: "Idempotency",
      status: "FAIL",
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Test writing an article
 */
async function testWriteArticle(): Promise<TestResult> {
  try {
    const requestBody = {
      request_id: `req_${Date.now()}`,
      actor: {
        tenant_id: "test_tenant",
        user_id: "test_user",
        roles: ["Member"],
      },
      tool: {
        name: "kb.write_article",
        arguments: {
          tenant_id: "test_tenant",
          title: "Test Knowledge Bank Article",
          content_md: `# Test Article\n\nThis is a test article written to the Knowledge Bank.\n\n## Content\n\nThis demonstrates that AI systems can write articles to the Knowledge Bank via the MCP endpoint.\n\n## Metadata\n- Created: ${new Date().toISOString()}\n- Source: Test Script\n- Topics: testing, knowledge-bank`,
          topics: ["testing", "knowledge-bank"],
          visibility: "team",
          tags: ["test", "mcp"],
        },
      },
    };

    const response = await fetch(`${MCP_SERVER_URL}/mcp/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: TEST_TOKEN,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok && data.status === "ok" && data.result?.article_id) {
      return {
        test: "Write Article",
        status: "PASS",
        message: `Successfully wrote article. Article ID: ${data.result.article_id}`,
        response: data.result,
      };
    } else {
      return {
        test: "Write Article",
        status: "FAIL",
        message: `Status: ${data.status}, Error: ${data.error?.message || "Unknown error"}`,
        response: data,
      };
    }
  } catch (error) {
    return {
      test: "Write Article",
      status: "FAIL",
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Test search functionality
 */
async function testSearch(): Promise<TestResult> {
  try {
    const requestBody = {
      request_id: `req_${Date.now()}`,
      actor: {
        tenant_id: "test_tenant",
        user_id: "test_user",
        roles: ["Member"],
      },
      tool: {
        name: "kb.search",
        arguments: {
          tenant_id: "test_tenant",
          q: "test knowledge bank",
          limit: 10,
        },
      },
    };

    const response = await fetch(`${MCP_SERVER_URL}/mcp/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: TEST_TOKEN,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok && data.status === "ok" && Array.isArray(data.result?.results)) {
      return {
        test: "Search",
        status: "PASS",
        message: `Search successful. Found ${data.result.results.length} results`,
        response: { resultCount: data.result.results.length },
      };
    } else {
      return {
        test: "Search",
        status: "FAIL",
        message: `Status: ${data.status}, Error: ${data.error?.message || "Unknown error"}`,
        response: data,
      };
    }
  } catch (error) {
    return {
      test: "Search",
      status: "FAIL",
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Test topic management
 */
async function testTopicManagement(): Promise<TestResult> {
  try {
    // Create a topic
    const createRequest = {
      request_id: `req_${Date.now()}`,
      actor: {
        tenant_id: "test_tenant",
        user_id: "test_user",
        roles: ["Admin"],
      },
      tool: {
        name: "kb.topic_upsert",
        arguments: {
          tenant_id: "test_tenant",
          topic_name: "Test Topic",
          cadence: "weekly",
          hourly_opt_in: false,
        },
      },
    };

    const createResponse = await fetch(`${MCP_SERVER_URL}/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: TEST_TOKEN,
      },
      body: JSON.stringify(createRequest),
    });

    const createData = await createResponse.json();

    if (createResponse.ok && createData.status === "ok") {
      return {
        test: "Topic Management",
        status: "PASS",
        message: `Successfully created topic: ${createData.result?.name}`,
        response: createData.result,
      };
    } else {
      return {
        test: "Topic Management",
        status: "FAIL",
        message: `Status: ${createData.status}, Error: ${createData.error?.message || "Unknown error"}`,
        response: createData,
      };
    }
  } catch (error) {
    return {
      test: "Topic Management",
      status: "FAIL",
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Test authentication
 */
async function testAuthentication(): Promise<TestResult> {
  try {
    const requestBody = {
      request_id: `req_${Date.now()}`,
      actor: {
        tenant_id: "test_tenant",
        user_id: "test_user",
        roles: ["Member"],
      },
      tool: {
        name: "kb.topic_list",
        arguments: {
          tenant_id: "test_tenant",
        },
      },
    };

    // Test without auth header
    const response = await fetch(`${MCP_SERVER_URL}/mcp/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // No Authorization header
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.status === 401 && data.error?.code === "UNAUTHORIZED") {
      return {
        test: "Authentication",
        status: "PASS",
        message: "Authentication correctly rejects requests without token",
        response: data,
      };
    } else {
      return {
        test: "Authentication",
        status: "FAIL",
        message: `Expected 401 UNAUTHORIZED, got ${response.status}`,
        response: data,
      };
    }
  } catch (error) {
    return {
      test: "Authentication",
      status: "FAIL",
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log("🧪 Testing MCP Endpoint for AI Integration\n");
  console.log(`Server URL: ${MCP_SERVER_URL}\n`);

  // Run tests sequentially
  results.push(await testToolDiscovery());
  results.push(await testAuthentication());
  results.push(await testWriteSessionSummary());
  results.push(await testIdempotency());
  results.push(await testWriteArticle());
  results.push(await testSearch());
  results.push(await testTopicManagement());

  // Print results
  console.log("\n📊 Test Results:\n");
  let passCount = 0;
  let failCount = 0;

  results.forEach((result) => {
    const icon = result.status === "PASS" ? "✅" : "❌";
    console.log(`${icon} ${result.test}: ${result.status}`);
    console.log(`   ${result.message}`);
    if (result.response) {
      console.log(
        `   Response: ${JSON.stringify(result.response, null, 2).split("\n").join("\n   ")}`
      );
    }
    console.log("");

    if (result.status === "PASS") passCount++;
    else failCount++;
  });

  console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed\n`);

  if (failCount === 0) {
    console.log("🎉 All tests passed! AI systems can successfully send data to the MCP endpoint.");
    process.exit(0);
  } else {
    console.log("⚠️  Some tests failed. Please review the errors above.");
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
