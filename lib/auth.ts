import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "./db";

/** Usernames that would collide with routes or look official. */
const RESERVED = new Set(["admin", "api", "rewe", "anmelden", "registrieren", "einstellungen", "markt", "besuch"]);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  session: { expiresIn: 60 * 60 * 24 * 90 },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 24,
      displayUsername: false,
      usernameValidator: (u) => /^[a-z0-9_-]+$/i.test(u) && !RESERVED.has(u.toLowerCase()),
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;

/** Current session in a Server Component / Action, deduped per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));
