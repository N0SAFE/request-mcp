import * as z from "zod";
import { createToolDefinition } from "./utils/tools";

// Define the static types first to resolve circular references
export type RequestType = {
  name: string;
  args?: any;
  prompt?: string;
  schema: any; // now required
  description?: string;
  responseData?: any;
  errorMessage?: string;
};

// Recursive type for container children
export interface RequestContainerChildType {
  request_container_id?: RequestContainerType;
  item?: RequestContainerType | RequestType;
  collection?: string;
  children?: RequestContainerChildType[];
}

// Type for container
export interface RequestContainerType {
  children: RequestContainerChildType[];
  name: string;
  description?: string;
  errorMessage?: string;
}

// Recursive type for container children
export interface RequestContainerChildType {
  request_container_id?: RequestContainerType;
  item?: RequestContainerType | RequestType;
  collection?: string;
  children?: RequestContainerChildType[];
}

// Type for container
export interface RequestContainerType {
  children: RequestContainerChildType[];
  name: string;
  description?: string;
  errorMessage?: string;
}

// Zod schema for Collections.Request
export const RequestSchema = z.object({
  name: z.string().describe("The name of the request."),
  prompt: z.string().optional().describe("The prompt for the request, if any."),
  schema: z.any().describe("a not null object JSON schema describing the expected input/output for the request."),
  description: z.string().optional().describe("A description of the request."),
}).describe("Schema for a single request definition. the schema property is a JSON schema describing the expected output for the request. this field should always be set to request the user what data you want them to send you.");

// Zod schema for Collections.RequestContainerChildren (recursive, fixed)
export const RequestContainerChildrenSchema: z.ZodType<RequestContainerChildType> =
  z.lazy(() =>
    z.object({
      request_container_id: z.lazy(() => RequestContainerSchema).optional().describe("Reference to a nested request container, if any."),
      item: z.union([
        z.lazy(() => RequestContainerSchema),
        RequestSchema
      ]).optional().describe("The item, which can be a request or a nested container."),
      collection: z.string().optional().describe("The collection name, if this child is part of a collection."),
      children: z.array(z.lazy(() => RequestContainerChildrenSchema)).optional().describe("Nested children of this container child."),
    }).describe("Schema for a child of a request container.") as z.ZodType<RequestContainerChildType>
  );

// Zod schema for Collections.RequestContainer
export const RequestContainerSchema = z.object({
  children: z.array(RequestContainerChildrenSchema).describe("The children of this request container."),
  name: z.string().describe("The name of the request container."),
  description: z.string().optional().describe("A description of the request container."),
}).describe("Schema for a request container definition.");


const requestWaitTool = createToolDefinition({
  name: "request_wait",
  description:
    "Waits for a request by ID to reach 'completed' or 'error' status, then returns the response as JSON. This tool always waits for the response automatically and returns the requested data when available.",
  inputSchema: z.object({
    requestId: z.string().describe("The ID of the request to wait for."),
  }),
});

const containerWaitTool = createToolDefinition({
  name: "container_wait",
  description:
    "Waits for a container by ID to reach 'completed' or 'error' status, then returns the container and all its children as JSON. This tool always waits for the response automatically and returns the requested data when available.",
  inputSchema: z.object({
    containerId: z.string().describe("The ID of the container to wait for."),
  }),
});

const registerRequestTool = createToolDefinition({
  name: "register_request",
  description:
    "Registers a request for frontend resolution and returns immediately with an API response containing the request ID. To obtain the requested data, you must later use the request_wait tool with the returned request ID.",
  inputSchema: RequestSchema,
});

const registerContainerTool = createToolDefinition({
  name: "register_container",
  description:
    "Registers a container for frontend resolution and returns immediately with an API response containing the container ID. To obtain the requested data, you must later use the container_wait tool with the returned container ID.",
  inputSchema: RequestContainerSchema,
});

const registerRequestWaitTool = createToolDefinition({
  name: "register_request_wait",
  description: "Registers a request, then waits for its completion or error. This tool always waits for the response automatically and returns the requested data when available. You must always provide a 'schema' property in your request, which should be a JSON schema object describing the exact structure of data you expect to receive in response.",
  inputSchema: RequestSchema
});

const registerContainerWaitTool = createToolDefinition({
  name: "register_container_wait",
  description: "Registers a container, then waits for its completion or error. This tool always waits for the response automatically and returns the requested data when available. For each child, you must always provide a 'schema' property in your request, which should be a JSON schema object describing the exact structure of data you expect to receive in response.",
  inputSchema: RequestContainerSchema,
});

export {
  requestWaitTool,
  containerWaitTool,
  registerRequestTool,
  registerContainerTool,
  registerRequestWaitTool,
  registerContainerWaitTool,
};
