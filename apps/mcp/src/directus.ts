import { Schema, createTypedClient } from "@repo/directus-sdk/client";
import {
  graphql,
  realtime,
  WebSocketClient,
  GraphqlClient,
  authentication,
  AuthenticationClient,
  AuthenticationStorage,
  rest,
  staticToken,
} from "@repo/directus-sdk";
import WebSocket from "ws";

export const createDefaultDirectusInstance = (
  url: string
): ReturnType<typeof createTypedClient> &
  WebSocketClient<Schema> &
  GraphqlClient<Schema> => {
  return createTypedClient(url, {
    globals: {
      WebSocket: WebSocket,
    }
  })
    .with(realtime())
    .with(graphql({ credentials: "include" }))
};

export const directusUrl = (process.env as any).NEXT_PUBLIC_API_URL! || "http://127.0.0.1:8055/"

export const createDirectusInstance = (
  url: string
): ReturnType<typeof createDefaultDirectusInstance> &
  AuthenticationClient<Schema> => {
  const directusInstance = createDefaultDirectusInstance(url).with(
    rest({
      credentials: "include",
      onRequest: (options) => ({ ...options, cache: "no-store" }),
    })
  );
  const enhanceDirectusInstance = directusInstance.with(
    authentication("json", {
      credentials: "include",
      autoRefresh: false,
      msRefreshBeforeExpires: 0,
    })
  );
  enhanceDirectusInstance.stopRefreshing();
  return enhanceDirectusInstance;
};

export const createDirectusWithDefaultUrl = (): ReturnType<
  typeof createDirectusInstance
> => {
  console.log("Directus URL:", directusUrl);
  console.log("Directus Token:", process.env.API_ADMIN_TOKEN || "JIqCg-azLH0pWOBIiAQJXDvIrWxoa2Aq");
  return createDirectusInstance(directusUrl!).with(
    staticToken(process.env.API_ADMIN_TOKEN! || "JIqCg-azLH0pWOBIiAQJXDvIrWxoa2Aq")
  );
};

const directus: ReturnType<typeof createDirectusWithDefaultUrl> =
  createDirectusWithDefaultUrl();

export default directus;
