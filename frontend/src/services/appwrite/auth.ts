import { Account } from "appwrite";
import { getAppwriteClient } from "@/services/appwrite/client";

let sessionPromise: Promise<void> | null = null;

/**
 * Guest access via anonymous session — no auth UI required.
 * Enable "Anonymous" auth in Appwrite Console → Auth → Settings.
 *
 * Appwrite forbids creating a session while another is active, so only
 * create when none exists; concurrent callers share one creation promise.
 */
export async function ensureGuestSession(): Promise<void> {
  const account = new Account(getAppwriteClient());
  try {
    await account.get();
    return;
  } catch {
    // No active session — create one, sharing a single in-flight promise.
    if (!sessionPromise) {
      sessionPromise = account
        .createAnonymousSession()
        .then(() => undefined)
        .finally(() => {
          sessionPromise = null;
        });
    }
    await sessionPromise;
  }
}

export function getAccount(): Account {
  return new Account(getAppwriteClient());
}
