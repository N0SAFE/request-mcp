import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "../mcp-server";
import {
  requestWaitTool,
  containerWaitTool,
  registerRequestTool,
  registerContainerTool,
  registerRequestWaitTool,
  registerContainerWaitTool,
} from "../mcp-tools";

// Simulated in-memory store for requests/containers and their statuses
const requestStore: Record<string, any> = {};
const containerStore: Record<string, any> = {};
const requestStatus: Record<string, string> = {};
const containerStatus: Record<string, string> = {};
const containerChildren: Record<string, any[]> = {};

function waitForStatus(
  id: string,
  statusMap: Record<string, string>,
  targetStatuses: string[]
): Promise<void> {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (targetStatuses.includes(statusMap[id])) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

class CustomMcpServer extends McpServer {
  constructor() {
    super({
      name: "custom-mcp-server",
      version: "1.0.0",
      toolsetConfig: { mode: "readWrite" },
      capabilities: {
        tools: {
          request_wait: {
            definitions: requestWaitTool,
            handlers: async ({ requestId }: { requestId: string }) => {
              await waitForStatus(requestId, requestStatus, ["completed", "error"]);
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(requestStore[requestId] || { error: "Not found" }, null, 2),
                  },
                ],
              };
            },
          },
          container_wait: {
            definitions: containerWaitTool,
            handlers: async ({ containerId }: { containerId: string }) => {
              await waitForStatus(containerId, containerStatus, ["completed", "error"]);
              const container = containerStore[containerId] || { error: "Not found" };
              const children = containerChildren[containerId] || [];
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({ ...container, children }, null, 2),
                  },
                ],
              };
            },
          },
          register_request: {
            definitions: registerRequestTool,
            handlers: async ({ request }: { request: any }) => {
              const id = request.id || `req_${Date.now()}`;
              requestStore[id] = request;
              requestStatus[id] = "pending";
              return {
                content: [
                  { type: "text", text: JSON.stringify({ registered: true, id }, null, 2) },
                ],
              };
            },
          },
          register_container: {
            definitions: registerContainerTool,
            handlers: async ({ container }: { container: any }) => {
              const id = container.id || `cont_${Date.now()}`;
              containerStore[id] = container;
              containerStatus[id] = "pending";
              containerChildren[id] = container.children || [];
              return {
                content: [
                  { type: "text", text: JSON.stringify({ registered: true, id }, null, 2) },
                ],
              };
            },
          },
          register_request_wait: {
            definitions: registerRequestWaitTool,
            handlers: async ({ request }: { request: any }) => {
              const id = request.id || `req_${Date.now()}`;
              requestStore[id] = request;
              requestStatus[id] = "pending";
              await waitForStatus(id, requestStatus, ["completed", "error"]);
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(requestStore[id] || { error: "Not found" }, null, 2),
                  },
                ],
              };
            },
          },
          register_container_wait: {
            definitions: registerContainerWaitTool,
            handlers: async ({ container }: { container: any }) => {
              const id = container.id || `cont_${Date.now()}`;
              containerStore[id] = container;
              containerStatus[id] = "pending";
              containerChildren[id] = container.children || [];
              await waitForStatus(id, containerStatus, ["completed", "error"]);
              const children = containerChildren[id] || [];
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({ ...containerStore[id], children }, null, 2),
                  },
                ],
              };
            },
          },
        },
      },
    });
  }
}

async function main() {
  const server = new CustomMcpServer();
  const transport = new StdioServerTransport();
  await server.server.connect(transport);
  console.error("Custom MCP server running on stdio");
}

main().catch((error) => console.error(error));
