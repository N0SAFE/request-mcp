import { z } from "zod";

export const Route = {
  name: "ApiMcpRequestsRequestIdRespond",
  params: z.object({
    requestId: z.string(),
  })
};

export const POST = {
  body: z.object({}),
  result: z.object({}),
};
