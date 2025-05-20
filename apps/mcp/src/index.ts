import { McpConfig, ToolCapability } from "types";
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
import {
  readUserPermissions,
  staticToken,
  withToken,
} from "@repo/directus-sdk";

process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:8055/";
process.env.API_ADMIN_TOKEN = "JIqCg-azLH0pWOBIiAQJXDvIrWxoa2Aq";

const tools = [
  createTool(
    requestWaitTool,
    async ({ requestId }, req, {
      authInfo: {
        token
      }
    }) => {
      const id = Number(requestId);
      // Fetch current request
      const reqArr = await directus.Requests.withToken(token).query({ filter: { id } });
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
          const { subscription, unsubscribe } = await directus.with(staticToken(token)).subscribe(
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
          for await (const _ of subscription) {
            const updated = await directus.Request.withToken(token).get(id);
            if (
              updated &&
              (updated.status === "completed" || updated.status === "error")
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
          console.error("Error in request wait tool", error);
          reject(new Error("Error waiting for request status update"));
        }
      });
    },
    {
      canBeEnabled: (authInfo) =>
        directus
          .request(withToken(authInfo.token, readUserPermissions()))
          .then((permissions) => permissions["request"].read.access === "full")
          .catch((error) => {
            console.error("Error checking permissions", error);
            return false;
          }),
    }
  ),
  createTool(
    containerWaitTool,
    async ({ containerId }, req, {
      authInfo: {
        token
      }
    }) => {
      const id = Number(containerId);
      const contArr = await directus.RequestContainers.withToken(token).query({
        filter: { id },
        fields: ["*", { children: ["*"] }],
      });
      const container = contArr[0];
      if (
        container &&
        (container.status === "completed" || container.status === "error")
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
          const { subscription, unsubscribe } = await directus.with(staticToken(token)).subscribe(
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
          for await (const _ of subscription) {
            const updated = await directus.RequestContainer.withToken(token).get(id, {
              fields: ["*", { children: ["*"] }],
            });
            if (
              updated &&
              (updated.status === "completed" || updated.status === "error")
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
          reject(new Error("Error waiting for container status update"));
        }
      });
    },
    {
      canBeEnabled: (authInfo) =>
        directus
          .request(withToken(authInfo.token, readUserPermissions()))
          .then(
            (permissions) =>
              permissions["request_container"].read.access === "full"
          )
          .catch((error) => {
            console.error("Error checking permissions", error);
            return false;
          }),
    }
  ),
  createTool(
    registerRequestTool,
    async (request, req, {
      authInfo: {
        token
      }
    }) => {
      const created = await directus.Request.withToken(token).create(request);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ registered: true, id: created.id }, null, 2),
          },
        ],
      };
    },
    {
      canBeEnabled: (authInfo) =>
        directus
          .request(withToken(authInfo.token, readUserPermissions()))
          .then(
            (permissions) =>
              permissions["request"].read.access === "full" &&
              permissions["request"].create.access === "full"
          )
          .catch((error) => {
            console.error("Error checking permissions", error);
            return false;
          }),
    }
  ),
  createTool(
    registerContainerTool,
    async (container, req, {
      authInfo: {
        token
      }
    }) => {
      const created = await directus.RequestContainer.withToken(token).create(container);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ registered: true, id: created.id }, null, 2),
          },
        ],
      };
    },
    {
      canBeEnabled: (authInfo) =>
        directus
          .request(withToken(authInfo.token, readUserPermissions()))
          .then(
            (permissions) =>
              permissions["request_container"].read.access === "full" &&
              permissions["request_container"].create.access === "full"
          )
          .catch((error) => {
            console.error("Error checking permissions", error);
            return false;
          }),
    }
  ),
  createTool(
    registerRequestWaitTool,
    async (request, req, {
      authInfo: {
        token
      }
    }) => {
      console.log("Request wait tool", request);
      try {
        const created = await directus.Request.withToken(token).create(request);
        console.log("Created request", created);
        const id = created.id;
        return new Promise(async (resolve, reject) => {
          try {
            const { subscription, unsubscribe } = await directus.with(staticToken(token)).subscribe(
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
            console.log("Subscribed to request updates", id);
            for await (const _ of subscription) {
              const updatedArr = await directus.Requests.withToken(token).query({
                filter: { id },
              });
              const updated = updatedArr[0];
              if (
                updated &&
                (updated.status === "completed" || updated.status === "error")
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
    },
    {
      canBeEnabled: (authInfo) =>
        directus
          .request(withToken(authInfo.token, readUserPermissions()))
          .then(
            (permissions) =>
              permissions["request"].create.access === "full" &&
              permissions["request"].read.access === "full"
          )
          .catch((error) => {
            console.error("Error checking permissions", error);
            return false;
          }),
    }
  ),
  createTool(
    registerContainerWaitTool,
    async (container, req, {
      authInfo: {
        token
      }
    }) => {
      const created = await directus.RequestContainer.withToken(token).create(container);
      const id = created.id;
      return new Promise(async (resolve, reject) => {
        try {
          const { subscription, unsubscribe } = await directus.withToken(token).subscribe(
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
          for await (const _ of subscription) {
            const updatedArr = await directus.RequestContainers.withToken(token).query({
              filter: { id },
              fields: ["*", { children: ["*"] }],
            });
            const updated = updatedArr[0];
            if (
              updated &&
              (updated.status === "completed" || updated.status === "error")
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
          reject(new Error("Error waiting for container status update"));
        }
      });
    },
    {
      canBeEnabled: (authInfo) =>
        directus
          .request(withToken(authInfo.token, readUserPermissions()))
          .then((permissions) => {
            console.log("Permissions", permissions);
            console.log(
              "Container permissions",
              permissions["request_container"].read.access,
              permissions["request_container"].create.access
            );
            return (
              permissions["request_container"].create.access === "full" &&
              permissions["request_container"].read.access === "full"
            );
          })
          .catch((error) => {
            console.error("Error checking permissions", error);
            return false;
          }),
    }
  ),
] satisfies ToolCapability[];

export class RequestMcpServer extends McpServer {
  constructor(config: McpConfig) {
    super({
      name: "request-mcp-server",
      version: "1.0.0",
      toolsetConfig: config.toolsetConfig || { mode: "readWrite" },
      capabilities: {
        tools: config.availableTools?.length
          ? config.availableTools?.length > 0
            ? tools.filter((tool) =>
                config.availableTools?.includes(tool.definition.name)
              )
            : tools
          : tools,
      },
      dynamicToolDiscovery: config.dynamicToolDiscovery || { enabled: true },
      instructions: `
# Using the MCP Request Server for Interactive Workflows

You have access to an MCP request server that allows you to interactively gather information or actions from users or systems. Use this server whenever you need additional context, clarification, or user input that cannot be determined from the current data or codebase alone.

## When to Use the MCP Request Server

Use the MCP request server in the following scenarios:

- When you need to prompt the user for information (e.g., preferences, missing parameters, choices).
- When you need to orchestrate a sequence of user/system actions that require responses.
- When you want to group multiple related requests and manage them as a batch.

## How to Use the MCP Request Server

Follow this process to interact with the MCP request server:

1. **Register a Request:**
   - Use the appropriate tool (e.g., \`register_request\`) to create a prompt or action for the user/system. This returns a request ID.
2. **Register a Container (if needed):**
   - If you need to group multiple requests, use a container tool (e.g., \`register_container\`).
3. **Wait for Completion:**
   - Use the corresponding wait tool (e.g., \`request_wait\` or \`container_wait\`) with the returned ID to block until the request or container is completed or an error occurs.
   - For convenience, you can use \`register_request_wait\` or \`register_container_wait\` to both register and wait for completion in a single step.
4. **Provide Valid Input:**
   - Always provide valid input objects as described in the tool schemas.
5. **Handle Errors:**
   - Handle errors as returned by the tool responses.

MCP Request Server usage instructions:

Core concepts:
- A request is a single, structured prompt or action for the user or system to respond to. It represents one unit of work.
- A request container is a group (batch) of requests, or even other containers, allowing you to manage and orchestrate multiple related requests together.
- This MCP server is specifically designed for when the LLM needs additional information about one or multiple variables and requires user input, either immediately or in a delayed fashion.

How tools work:
- There are tools to register (create), wait for, and manage both requests and containers.
- When you register a request or container (using registerRequestTool or registerContainerTool), it is created and an ID is returned immediately. This does NOT wait for the request or container to be completed or processed.
- To obtain the result or completion status, you must call the corresponding wait tool (requestWaitTool or containerWaitTool) with the returned ID. You should always await the result if you need the outcome before proceeding.
- For convenience, register*WaitTool variants (like registerRequestWaitTool) will both register and wait for completion in a single step.

Usage workflow:
1. Register a request or container using the appropriate tool when you need additional information from the user.
2. If you need the result immediately, call the corresponding wait tool with the returned ID and await completion.
3. Alternatively, use a register*WaitTool to register and wait in one step for immediate responses.
4. For delayed responses, you can register a request and retrieve the result later using the wait tools.

Important:
- All tools require valid input objects as described in their schemas.
- Handle errors as returned by the tool responses.
- Use this server whenever you need to gather more contextual information about variables from the user.
`
    });
  }
}
