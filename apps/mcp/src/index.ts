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
import { createTool } from "./utils/tools";

process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:8055/";
process.env.API_ADMIN_TOKEN = "JIqCg-azLH0pWOBIiAQJXDvIrWxoa2Aq";

class CustomMcpServer extends McpServer {
  constructor() {
    super({
      name: "custom-mcp-server",
      version: "1.0.0",
      toolsetConfig: { mode: "readWrite" },
      capabilities: {
        tools: [
          createTool(
            requestWaitTool,
            async ({ requestId }: { requestId: string }) => {
              const id = Number(requestId);
              // Fetch current request
              const reqArr = await directus.Requests.query({ filter: { id } });
              const request = reqArr[0];
              if (
                request &&
                (request.status === "completed" || request.status === "error")
              ) {
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
                try {
                  const { subscription, unsubscribe } =
                    await directus.subscribe("request", {
                      event: "update",
                      query: {
                        filter: {
                          id: { _eq: id },
                          status: { _in: ["completed", "error"] },
                        },
                      },
                    });
                  const timeout = setTimeout(() => {
                    unsubscribe();
                    reject(
                      new Error("Timeout waiting for request status update")
                    );
                  }, 60000);
                  for await (const _ of subscription) {
                    const updated = await directus.Request.get(id);
                    if (
                      updated &&
                      (updated.status === "completed" ||
                        updated.status === "error")
                    ) {
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
                } catch (error) {
                  console.error("Error in request wait tool", error);
                  reject(new Error("Error waiting for request status update"));
                }
              });
            }
          ),
          createTool(
            containerWaitTool,
            async ({ containerId }: { containerId: string }) => {
              const id = Number(containerId);
              const contArr = await directus.RequestContainers.query({
                filter: { id },
                fields: ["*", { children: ["*"] }],
              });
              const container = contArr[0];
              if (
                container &&
                (container.status === "completed" ||
                  container.status === "error")
              ) {
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
                try {
                  const { subscription, unsubscribe } =
                    await directus.subscribe("request_container", {
                      event: "update",
                      query: {
                        filter: {
                          id: { _eq: id },
                          status: { _in: ["completed", "error"] },
                        },
                      },
                    });
                  for await (const _ of subscription) {
                    const updated = await directus.RequestContainer.get(id, {
                      fields: ["*", { children: ["*"] }],
                    });
                    if (
                      updated &&
                      (updated.status === "completed" ||
                        updated.status === "error")
                    ) {
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
                } catch (error) {
                  console.error("Error in container wait tool", error);
                  reject(
                    new Error("Error waiting for container status update")
                  );
                }
              });
            }
          ),
          createTool(registerRequestTool, async (request) => {
            const created = await directus.Request.create(request);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    { registered: true, id: created.id },
                    null,
                    2
                  ),
                },
              ],
            };
          }),
          createTool(registerContainerTool, async (container) => {
            const created = await directus.RequestContainer.create(container);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    { registered: true, id: created.id },
                    null,
                    2
                  ),
                },
              ],
            };
          }),
          createTool(registerRequestWaitTool, async (request) => {
            console.log("Request wait tool", request);
            try {
              const created = await directus.Request.create(request);
              console.log("Created request", created);
              const id = created.id;
              return new Promise(async (resolve, reject) => {
                try {
                  const { subscription, unsubscribe } =
                    await directus.subscribe("request", {
                      event: "update",
                      query: {
                        filter: {
                          id: { _eq: id },
                          status: { _in: ["completed", "error"] },
                        },
                      },
                    });
                  console.log("Subscribed to request updates", id);
                  for await (const _ of subscription) {
                    const updatedArr = await directus.Requests.query({
                      filter: { id },
                    });
                    const updated = updatedArr[0];
                    if (
                      updated &&
                      (updated.status === "completed" ||
                        updated.status === "error")
                    ) {
                      console.log("Request updated", updated);
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
                } catch (error) {
                  console.error("Error in request wait tool", error);
                  reject(new Error("Error waiting for request status update"));
                }
              });
            } catch (error) {
              console.error("Error in request wait tool", error);
              return {
                isError: true,
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(
                      { registered: false, error: JSON.stringify(error) },
                      null,
                      2
                    ),
                  },
                ],
              };
            }
          }),
          createTool(registerContainerWaitTool, async (container) => {
            const created = await directus.RequestContainer.create(container);
            const id = created.id;
            return new Promise(async (resolve, reject) => {
              try {
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
                  reject(
                    new Error("Timeout waiting for container status update")
                  );
                }, 60000);
                for await (const _ of subscription) {
                  const updatedArr = await directus.RequestContainers.query({
                    filter: { id },
                    fields: ["*", { children: ["*"] }],
                  });
                  const updated = updatedArr[0];
                  if (
                    updated &&
                    (updated.status === "completed" ||
                      updated.status === "error")
                  ) {
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
              } catch (error) {
                console.error("Error in container wait tool", error);
                reject(new Error("Error waiting for container status update"));
              }
            });
          }),
        ],
      },
    });
  }
}

async function main() {
  const server = new CustomMcpServer();
  const transport = new StdioServerTransport();
  const [health, websocketHealth] = await Promise.all([
    directus
      .serverHealth()
      .then((health) => health?.status === "ok")
      .catch(() => false),
    directus
      .subscribe("request")
      .then((sub) => {
        sub.unsubscribe();
        return true;
      })
      .catch(() => false),
  ]);
  if (!health || !websocketHealth) {
    if (!health) {
      throw new Error("Directus server is not available");
    }
    if (!websocketHealth) {
      throw new Error("Directus websocket is not available");
    }
    return;
  }
  await server.server.connect(transport);
  console.error("Custom MCP server running on stdio");
}

main().catch((error) => console.error(error));
