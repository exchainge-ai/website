import { PrivyClient } from "@privy-io/server-auth";
import { validateEnv } from "./env";

let privyServerInstance: PrivyClient | null = null;

function getPrivyServer(): PrivyClient {
  if (!privyServerInstance) {
    const env = validateEnv();
    privyServerInstance = new PrivyClient(env.privyAppId, env.privyAppSecret);
  }
  return privyServerInstance;
}

export const privyServer = new Proxy({} as PrivyClient, {
  get(target, prop) {
    const server = getPrivyServer();
    const value = server[prop as keyof PrivyClient];
    return typeof value === 'function' ? value.bind(server) : value;
  }
});
