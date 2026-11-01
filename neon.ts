import { defineConfig } from "@neon/config/v1";

// Declarative Neon services for the BeatVault Studio project.
// Nothing is provisioned until this repo is linked and the config is applied.
export default defineConfig({
  auth: true, // Managed Better Auth
  aiGateway: true,
  preview: {
    realtime: true,
  },
  buckets: {
    assets: { access: "private" },
  },
  functions: {
    hello: { name: "Hello World", source: "./hello.ts" },
  },
});
