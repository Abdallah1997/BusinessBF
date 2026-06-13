import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

/**
 * Social providers are wired only when their env keys exist, so the app runs
 * fine with none configured (the buttons simply don't render). Add keys to
 * .env to enable:
 *   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET   (console.cloud.google.com)
 *   DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET (discord.com/developers)
 * Redirect/callback URL for each: {BETTER_AUTH_URL}/api/auth/callback/<provider>
 */
type SocialProviders = NonNullable<BetterAuthOptions["socialProviders"]>;

function buildSocialProviders(): SocialProviders {
  const providers: SocialProviders = {};
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    providers.discord = {
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    };
  }
  return providers;
}

/** Which social providers are usable right now. Read by the UI to show only live buttons. */
export function enabledSocialProviders(): ("google" | "discord")[] {
  const out: ("google" | "discord")[] = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) out.push("google");
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) out.push("discord");
  return out;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  socialProviders: buildSocialProviders(),
  account: {
    accountLinking: {
      // Link a social login to an existing email account when the verified
      // email matches, instead of creating a duplicate user.
      enabled: true,
      trustedProviders: ["google", "discord"],
      // We don't run an email-verification flow, so local accounts are always
      // emailVerified:false. Without this, better-auth refuses to link a
      // social login to them (account_not_linked) and bounces to the landing
      // page. Only the trusted providers above (which verify email on their
      // side) can link, so this stays safe against takeover.
      requireLocalEmailVerified: false,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14, // 14 days
    updateAge: 60 * 60 * 24, // refresh expiry at most once a day
  },
  rateLimit: {
    // On by default only in production; force on everywhere so auth
    // endpoints are always brute-force protected.
    enabled: true,
    window: 60,
    max: 20,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
