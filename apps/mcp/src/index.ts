import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "./mcp-server";
import {
  requestWaitTool,
  containerWaitTool,
  registerRequestTool,
  registerContainerTool,
  registerRequestWaitTool,
  registerContainerWaitTool,
} from "./mcp-tools";
import directus from "./directus";

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
              const id = Number(requestId);
              // Fetch current request
              const reqArr = await directus.Requests.query({ filter: { id } });
              const request = reqArr[0];
              if (request && (request.status === "completed" || request.status === "error")) {
                return {
                  content: [
                    {
                      type: "text",
                      text: JSON.stringify(request, null, 2),
                    },
                  ],
                };
              }
              // Subscribe to status changes
              return new Promise(async (resolve, reject) => {
                const { subscription, unsubscribe } = await directus.subscribe(
                  "request",
                  {
                    event: "update",
                    query: {
                      filter: {
                        id: { _eq: id },
                        status: { _in: ["completed", "error"] },
                      },
                    },
                  }
                );
                const timeout = setTimeout(() => {
                  unsubscribe();
                  reject(new Error("Timeout waiting for request status update"));
                }, 60000);
                for await (const _ of subscription) {
                  const updatedArr = await directus.Requests.query({ filter: { id } });
                  const updated = updatedArr[0];
                  if (updated && (updated.status === "completed" || updated.status === "error")) {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve({
                      content: [
                        {
                          type: "text",
                          text: JSON.stringify(updated, null, 2),
                        },
                      ],
                    });
                    break;
                  }
                }
              });
            },
          },
          container_wait: {
            definitions: containerWaitTool,
            handlers: async ({ containerId }: { containerId: string }) => {
              const id = Number(containerId);
              const contArr = await directus.RequestContainers.query({ filter: { id }, fields: ["*", { children: ["*"] }] });
              const container = contArr[0];
              if (container && (container.status === "completed" || container.status === "error")) {
                return {
                  content: [
                    {
                      type: "text",
                      text: JSON.stringify(container, null, 2),
                    },
                  ],
                };
              }
              return new Promise(async (resolve, reject) => {
                const { subscription, unsubscribe } = await directus.subscribe(
                  "request_container",
                  {
                    event: "update",
                    query: {
                      filter: {
                        id: { _eq: id },
                        status: { _in: ["completed", "error"] },
                      },
                    },
                  }
                );
                const timeout = setTimeout(() => {
                  unsubscribe();
                  reject(new Error("Timeout waiting for container status update"));
                }, 60000);
                for await (const _ of subscription) {
                  const updatedArr = await directus.RequestContainers.query({ filter: { id }, fields: ["*", { children: ["*"] }] });
                  const updated = updatedArr[0];
                  if (updated && (updated.status === "completed" || updated.status === "error")) {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve({
                      content: [
                        {
                          type: "text",
                          text: JSON.stringify(updated, null, 2),
                        },
                      ],
                    });
                    break;
                  }
                }
              });
            },
          },
          register_request: {
            definitions: registerRequestTool,
            handlers: async ({ request }: { request: any }) => {
              const createdArr = await directus.Requests.create([request]);
              const created = createdArr[0];
              return {
                content: [
                  { type: "text", text: JSON.stringify({ registered: true, id: created.id }, null, 2) },
                ],
              };
            },
          },
          register_container: {
            definitions: registerContainerTool,
            handlers: async ({ container }: { container: any }) => {
              const createdArr = await directus.RequestContainers.create([container]);
              const created = createdArr[0];
              return {
                content: [
                  { type: "text", text: JSON.stringify({ registered: true, id: created.id }, null, 2) },
                ],
              };
            },
          },
          register_request_wait: {
            definitions: registerRequestWaitTool,
            handlers: async ({ request }: { request: any }) => {
              const createdArr = await directus.Requests.create([request]);
              const created = createdArr[0];
              const id = created.id;
              return new Promise(async (resolve, reject) => {
                const { subscription, unsubscribe } = await directus.subscribe(
                  "request",
                  {
                    event: "update",
                    query: {
                      filter: {
                        id: { _eq: id },
                        status: { _in: ["completed", "error"] },
                      },
                    },
                  }
                );
                const timeout = setTimeout(() => {
                  unsubscribe();
                  reject(new Error("Timeout waiting for request status update"));
                }, 60000);
                for await (const _ of subscription) {
                  const updatedArr = await directus.Requests.query({ filter: { id } });
                  const updated = updatedArr[0];
                  if (updated && (updated.status === "completed" || updated.status === "error")) {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve({
                      content: [
                        {
                          type: "text",
                          text: JSON.stringify(updated, null, 2),
                        },
                      ],
                    });
                    break;
                  }
                }
              });
            },
          },
          register_container_wait: {
            definitions: registerContainerWaitTool,
            handlers: async ({ container }: { container: any }) => {
              const createdArr = await directus.RequestContainers.create([container]);
              const created = createdArr[0];
              const id = created.id;
              return new Promise(async (resolve, reject) => {
                const { subscription, unsubscribe } = await directus.subscribe(
                  "request_container",
                  {
                    event: "update",
                    query: {
                      filter: {
                        id: { _eq: id },
                        status: { _in: ["completed", "error"] },
                      },
                    },
                  }
                );
                const timeout = setTimeout(() => {
                  unsubscribe();
                  reject(new Error("Timeout waiting for container status update"));
                }, 60000);
                for await (const _ of subscription) {
                  const updatedArr = await directus.RequestContainers.query({ filter: { id }, fields: ["*", { children: ["*"] }] });
                  const updated = updatedArr[0];
                  if (updated && (updated.status === "completed" || updated.status === "error")) {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve({
                      content: [
                        {
                          type: "text",
                          text: JSON.stringify(updated, null, 2),
                        },
                      ],
                    });
                    break;
                  }
                }
              });
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
