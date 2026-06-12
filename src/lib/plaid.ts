import "server-only";

import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

/**
 * Plaid client. Configure with:
 *   PLAID_CLIENT_ID, PLAID_SECRET: from https://dashboard.plaid.com
 *   PLAID_ENV: sandbox | development | production (default sandbox)
 *   ENCRYPTION_KEY: required to store access tokens (see src/lib/crypto.ts)
 */

export function isPlaidConfigured(): boolean {
  return Boolean(
    process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET && process.env.ENCRYPTION_KEY,
  );
}

let _client: PlaidApi | null = null;

export function plaidClient(): PlaidApi {
  if (!_client) {
    const env = process.env.PLAID_ENV ?? "sandbox";
    _client = new PlaidApi(
      new Configuration({
        basePath: PlaidEnvironments[env] ?? PlaidEnvironments.sandbox,
        baseOptions: {
          headers: {
            "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
            "PLAID-SECRET": process.env.PLAID_SECRET,
          },
        },
      }),
    );
  }
  return _client;
}
