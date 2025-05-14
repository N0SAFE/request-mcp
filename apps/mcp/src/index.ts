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
    });
  }
}
