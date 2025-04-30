#!/usr/bin/env node

import { RequestMcpServer } from "../index";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getConfigFromCommanderAndEnv } from "./config";

async function main() {
  const server = new RequestMcpServer(getConfigFromCommanderAndEnv());
  const transport = new StdioServerTransport();
  await server.server.connect(transport);
  try {
    server.server.sendLoggingMessage({
      level: "info",
      data: "MCP server started",
    });
  } catch (err) {}
}

main().catch((err) => {
  console.error("Failed to start MCP server:", err);
  process.exit(1);
});
