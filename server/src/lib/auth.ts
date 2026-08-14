import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/db.js";
import { user, session, account, verification } from "../db/schema.js";

const isProd = process.env.NODE_ENV === "production";
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

// Cross-origin cookie strategy (client and server are different origins):
// - Prod: client/server share a parent domain (app.x / api.x), so the
//   cookie is same-site -> SameSite=Lax works and is reliable in Safari.
// - Local dev: localhost:3000 <-> localhost:5000 are different ports, so
//   the browser treats this as cross-site even though it's "localhost" ->
//   needs SameSite=None (Chrome allows Secure cookies on localhost over
//   plain HTTP as a special case, so this still works without HTTPS).
const cookieAttributes = isProd
  ? { sameSite: "lax" as const, secure: true }
  : { sameSite: "none" as const, secure: true };

const githubEnabled = Boolean(
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:5000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [clientUrl],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
  },
  ...(githubEnabled
    ? {
        socialProviders: {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
          },
        },
      }
    : {}),
  user: {
    additionalFields: {
      plan: {
        type: "string",
        input: false,
        defaultValue: "free",
      },
    },
  },
  advanced: {
    defaultCookieAttributes: cookieAttributes,
    // Prod domain-sharing (app.x.dev / api.x.dev) is set up once a real
    // parent domain exists; leave disabled for local dev.
    crossSubDomainCookies: {
      enabled: false,
    },
  },
});
