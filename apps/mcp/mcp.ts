#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Flag to enable only GET operations (read-only mode) - Applies to tool listing
const READ_ONLY_MODE: boolean = process.env.READ_ONLY_MODE === "true" || false;

// --- Internal map to link requestId to its resolve/reject functions ---
// This is still needed to handle the Promise returned to the MCP SDK
interface InternalPendingPromise {
  resolve: (data: any) => void;
  reject: (error: any) => void;
  timestamp: number; // Keep timestamp for internal timeout
}
const internalPendingPromises: Map<string, InternalPendingPromise> = new Map();

// --- MCP Server Setup ---

interface ServerCapabilities {
  capabilities: {
    tools: Record<string, any>;
  };
}

// The server instance for the MCP server
const server = new Server(
  {
    name: "statistics-mcp-server-webhook", // Updated name
    version: "1.1.0", // Updated version
  },
  {
    capabilities: {
      tools: {},
    },
  } as ServerCapabilities
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Only the registration tool is exposed to the AI.
  // The actual execution still happens externally based on the parameters passed.
  return {
    tools: [
      {
        name: "register_pending_request",
        description: "Registers a request that requires external fulfillment via webhook and dashboard.", // Updated description
        inputSchema: {
          type: "object",
          properties: {
            toolToExecute: {
              type: "string",
              description: "The name of the actual tool/operation to be executed externally.",
            },
            toolArgs: {
              type: "object",
              description: "The arguments for the toolToExecute.",
              additionalProperties: true, // Allow any structure for args
            },
          },
          required: ["toolToExecute", "toolArgs"],
        },
      },
    ],
  };
});

interface ToolRequest {
  params: {
    name: string;
    arguments?: any;
  };
}

server.setRequestHandler(
  CallToolRequestSchema,
  async (request: ToolRequest) => {
    const { name, arguments: topLevelArgs } = request.params;
    const requestId = uuidv4();
    const requestTimestamp = Date.now(); // Capture timestamp

    // Validate that the correct tool is being called
    if (name !== "register_pending_request") {
      console.error(`Error: Received call for unsupported tool: ${name}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: `Unsupported tool: ${name}. Only 'register_pending_request' is available.` },
              null,
              2
            ),
          },
        ],
      };
    }

    // Validate top-level arguments structure
    if (topLevelArgs === undefined || topLevelArgs === null || typeof topLevelArgs !== "object") {
      console.error(`Error: Invalid arguments structure for register_pending_request.`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: `Invalid arguments provided for register_pending_request.` },
              null,
              2
            ),
          },
        ],
      };
    }

    // Extract the actual tool name and arguments from the payload
    const { toolToExecute, toolArgs } = topLevelArgs as {
      toolToExecute?: string;
      toolArgs?: any;
    };

    // Validate nested arguments
    if (typeof toolToExecute !== "string" || !toolToExecute) {
      console.error(
        `Error: Missing or invalid 'toolToExecute' argument in register_pending_request.`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: `Missing or invalid 'toolToExecute' argument.` },
              null,
              2
            ),
          },
        ],
      };
    }
    if (toolArgs === undefined || toolArgs === null) {
      console.error(`Error: Missing 'toolArgs' argument in register_pending_request.`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: `Missing 'toolArgs' argument.` },
              null,
              2
            ),
          },
        ],
      };
    }

    // Check for write operations attempt in read-only mode (applied to the nested tool)
    if (READ_ONLY_MODE && !toolToExecute.startsWith("get_")) {
      console.error(`Read-only mode violation attempt: Tool ${toolToExecute}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: `Read-only mode: Cannot execute tool ${toolToExecute}` },
              null,
              2
            ),
          },
        ],
      };
    }

    console.log(
      `MCP: Registering request ${requestId} for tool ${toolToExecute} with dashboard API...`
    );

    // --- Register request with the Dashboard API ---
    try {
      const registerResponse = await fetch(dashboardApiUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              requestId,
              toolName: toolToExecute,
              args: toolArgs,
              timestamp: requestTimestamp, // Use the captured timestamp
          }),
      });

      if (!registerResponse.ok) {
          const errorBody = await registerResponse.text();
          throw new Error(`Failed to register request with dashboard API: ${registerResponse.status} - ${errorBody}`);
      }
      console.log(`MCP: Successfully registered ${requestId} with dashboard API.`);

    } catch (registrationError: any) {
        console.error(`MCP: Error registering request ${requestId} with dashboard API:`, registrationError.message);
        // Return error to the AI if registration fails
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        { error: `Failed to register request for external processing: ${registrationError.message}` },
                        null,
                        2
                    ),
                },
            ],
        };
    }
    // --- End Registration ---

    console.log(
      `MCP: Waiting for response via webhook: POST /webhook/respond with body { "requestId": "${requestId}", ... }`
    );

    // --- Wait for response via internal promise map ---
    try {
      const responseData = await new Promise((resolve, reject) => {
        internalPendingPromises.set(requestId, {
          resolve,
          reject,
          timestamp: requestTimestamp, // Use the same timestamp for timeout tracking
        });
      });

      // Successfully received response via webhook
      console.log(`MCP: Request ${requestId} (for ${toolToExecute}) completed successfully via webhook.`);
      return {
        content: [
          // Assume responseData is the direct JSON payload expected by the AI
          { type: "text", text: JSON.stringify(responseData, null, 2) },
        ],
      };
    } catch (error: any) {
      // Error occurred (timeout or error sent via webhook)
      console.error(`MCP: Request ${requestId} (for ${toolToExecute}) failed:`, error.message);
      internalPendingPromises.delete(requestId); // Ensure cleanup on error too
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: `Tool execution for ${toolToExecute} failed: ${error.message}` },
              null,
              2
            ),
          },
        ],
      };
    }
    // --- End Waiting ---
  }
);

async function main(): Promise<void> {
  console.log("Starting main function...");

  // --- Start Webhook Server ---
  app.listen(expressPort, () => {
    console.log(
      `Webhook server listening on http://localhost:${expressPort}/webhook/respond`
    );
  });

  // --- Optional: Original Auth/HealthCheck Logic (can be moved to external process) ---
  // console.log("Health check URL:", `${API_BASE_URL}/v2/health/ready`);
  // try {
  //   const healthCheck = await axios.get(`${API_BASE_URL}/v2/health/ready`);
  //   console.log("Health check status:", healthCheck.status, healthCheck.data);
  //   if (healthCheck.status !== 200) {
  //     console.warn(
  //       `Health check failed with status: ${healthCheck.status}. The external process might have issues.`
  //     );
  //   }
  // } catch (error: any) {
  //   console.error("Health check failed:", error.message);
  // }
  // Authentication logic (like login) should ideally be handled by the external process
  // that calls the actual API and responds to the webhook.

  // --- Start MCP Server ---
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Statistics MCP Server (Webhook+Dashboard Mode) running on stdio"); // Updated log message
}

main().catch((error: Error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
