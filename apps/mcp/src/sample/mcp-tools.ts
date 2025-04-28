import { ToolDefinition } from "../types";

// Tool definitions for the new MCP server
const requestWaitTool: ToolDefinition = {
  name: "request_wait",
  description: "Waits for a request by ID to reach 'completed' or 'error' status, then returns the response as JSON.",
  inputSchema: {
    type: "object",
    properties: {
      requestId: { type: "string", description: "The ID of the request to wait for." },
    },
    required: ["requestId"],
  },
};

const containerWaitTool: ToolDefinition = {
  name: "container_wait",
  description: "Waits for a container by ID to reach 'completed' or 'error' status, then returns the container and all its children as JSON.",
  inputSchema: {
    type: "object",
    properties: {
      containerId: { type: "string", description: "The ID of the container to wait for." },
    },
    required: ["containerId"],
  },
};

const registerRequestTool: ToolDefinition = {
  name: "register_request",
  description: "Registers a request for frontend resolution, returns immediately with API response.",
  inputSchema: {
    type: "object",
    properties: {
      request: { type: "object", description: "The request object to register." },
    },
    required: ["request"],
  },
};

const registerContainerTool: ToolDefinition = {
  name: "register_container",
  description: "Registers a container for frontend resolution, returns immediately with API response.",
  inputSchema: {
    type: "object",
    properties: {
      container: { type: "object", description: "The container object to register." },
    },
    required: ["container"],
  },
};

const registerRequestWaitTool: ToolDefinition = {
  name: "register_request_wait",
  description: "Registers a request, then waits for its completion or error.",
  inputSchema: {
    type: "object",
    properties: {
      request: { type: "object", description: "The request object to register and wait for." },
    },
    required: ["request"],
  },
};

const registerContainerWaitTool: ToolDefinition = {
  name: "register_container_wait",
  description: "Registers a container, then waits for its completion or error.",
  inputSchema: {
    type: "object",
    properties: {
      container: { type: "object", description: "The container object to register and wait for." },
    },
    required: ["container"],
  },
};

export {
  requestWaitTool,
  containerWaitTool,
  registerRequestTool,
  registerContainerTool,
  registerRequestWaitTool,
  registerContainerWaitTool,
};
