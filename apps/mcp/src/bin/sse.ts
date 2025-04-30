#!/usr/bin/env node

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request } from "express";
import { RequestMcpServer } from "../index";
import { getConfigFromCommanderAndEnv } from "./config";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import directus from "../directus";
import { withToken } from "@repo/directus-sdk";

const app = express();
const server = new RequestMcpServer(getConfigFromCommanderAndEnv());

let transport: SSEServerTransport | null = null;

app.get("/sse", (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  server.server.connect(transport);
  server.server.sendLoggingMessage({
    level: "info",
    data: "MCP server started",
  });
});

app.post(
  "/messages",
  async (
    req: Request & {
      auth?: AuthInfo;
    },
    res
  ) => {
    if (!req.header("Authorization")) {
      res.status(401).send("Unauthorized");
      return;
    }
    console.log(req.header("Authorization"));
    try {
      const me = await directus.DirectusUser.withToken(
        req.header("Authorization")?.replace("Bearer ", "")!
      ).Me.read({
        fields: ["*"],
      });
      console.log(me)
      req.auth = {
        token: req.header("Authorization")?.replace("Bearer ", "")!,
        clientId: "",
        scopes: [],
        extra: me,
      };
      if (transport) {
        transport.handlePostMessage(req, res);
      }
    } catch (error) {
      console.error("Error in SSE handler", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.listen(3500);
console.log("SSE server started on port 3500");
