import * as z from "zod";
import { createToolDefinition } from "./utils/tools";
import { Collections } from "@repo/directus-sdk/client";
import zodToJsonSchema from "zod-to-json-schema";

// Define the static types first to resolve circular references
export type RequestType = {
  name: string;
  args?: any;
  prompt?: string;
  inputType: "json" | "boolean" | "multi-select" | "select" | "schema" | "text";
  selectOptions?: any;
  schema?: any;
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

// Zod schema for Collections.Request
export const RequestSchema = z.object({
  name: z.string(),
  args: z
    .any()
    .describe(
      "The additional arguments for the request. This is a JSON object."
    ),
  prompt: z.string().optional(),
  inputType: z.enum([
    "json",
    "boolean",
    "multi-select",
    "select",
    "schema",
    "text",
  ]),
  selectOptions: z.any().optional(),
  schema: z.any().optional(),
  description: z.string().optional(),
  responseData: z.any().optional(),
  errorMessage: z.string().optional(),
});

// Zod schema for Collections.RequestContainerChildren (recursive, fixed)
export const RequestContainerChildrenSchema: z.ZodType<RequestContainerChildType> =
  z.lazy(() =>
    z.object({
      request_container_id: RequestContainerSchema.optional(),
      item: z
        .union([RequestContainerSchema.optional(), RequestSchema.optional()])
        .optional(),
      collection: z.string().optional(),
      children: z.array(RequestContainerChildrenSchema).optional(),
    })
  );

// Zod schema for Collections.RequestContainer
export const RequestContainerSchema: z.ZodType<RequestContainerType> = z.lazy(
  () =>
    z.object({
      children: z.array(RequestContainerChildrenSchema),
      name: z.string(),
      description: z.string().optional(),
      errorMessage: z.string().optional(),
    })
);

const requestWaitTool = createToolDefinition({
  name: "request_wait",
  description:
    "Waits for a request by ID to reach 'completed' or 'error' status, then returns the response as JSON.",
  inputSchema: z.object({
    requestId: z.string().describe("The ID of the request to wait for."),
  }),
});

const containerWaitTool = createToolDefinition({
  name: "container_wait",
  description:
    "Waits for a container by ID to reach 'completed' or 'error' status, then returns the container and all its children as JSON.",
  inputSchema: z.object({
    containerId: z.string().describe("The ID of the container to wait for."),
  }),
});

const registerRequestTool = createToolDefinition({
  name: "register_request",
  description:
    "Registers a request for frontend resolution, returns immediately with API response.",
  inputSchema: RequestSchema,
});

const registerContainerTool = createToolDefinition({
  name: "register_container",
  description:
    "Registers a container for frontend resolution, returns immediately with API response.",
  inputSchema: RequestContainerSchema,
});

const registerRequestWaitTool = createToolDefinition({
  name: "register_request_wait",
  description: "Registers a request, then waits for its completion or error.",
  inputSchema: RequestSchema,
});

const registerContainerWaitTool = createToolDefinition({
  name: "register_container_wait",
  description: "Registers a container, then waits for its completion or error.",
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
