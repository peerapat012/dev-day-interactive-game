import { Account } from "appwrite";
import { getAppwriteClient } from "@/services/appwrite/client";

let initPromise: Promise<void> | null = null;

/**
 * Guest access via anonymous session — no auth UI required.
 * Enable "Anonymous" auth in Appwrite Console → Auth → Settings.
 */
export async function ensureGuestSession(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const account = new Account(getAppwriteClient());
    try {
      await account.get();
    } catch {
      await account.createAnonymousSession();
    }
  })();

  return initPromise;
}

export function getAccount(): Account {
  return new Account(getAppwriteClient());
}
