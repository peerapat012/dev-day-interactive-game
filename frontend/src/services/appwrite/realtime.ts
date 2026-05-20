import { Channel, Realtime, type RealtimeSubscription } from "appwrite";
import { APPWRITE } from "@/lib/constants";
import { getAppwriteClient } from "@/services/appwrite/client";
import { ensureGuestSession } from "@/services/appwrite/auth";
import type { Entry } from "@/types/entry";

export type EntryRealtimeHandler = (entry: Entry, event: string[]) => void;

let realtimeClient: Realtime | null = null;
let activeSubscription: RealtimeSubscription | null = null;
let subscribePromise: Promise<RealtimeSubscription | null> | null = null;
const listeners = new Set<EntryRealtimeHandler>();

function getRealtime(): Realtime {
  if (!realtimeClient) {
    realtimeClient = new Realtime(getAppwriteClient());
  }
  return realtimeClient;
}

function getEntryChannels(): string[] {
  const { databaseId, collectionId } = APPWRITE;
  const channel = Channel.tablesdb(databaseId).table(collectionId).row();
  return [channel.toString(), `tablesdb.${databaseId}.tables.${collectionId}.rows`];
}

function mapPayload(payload: Record<string, unknown>): Entry {
  return {
    $id: payload.$id as string,
    name: (payload.name as string) ?? "guest",
    input: (payload.input as string) ?? "",
    group: (payload.group as string) ?? "",
    roomId: (payload.roomId as string) ?? "",
    guestId: (payload.guestId as string) ?? "",
    createdAt: (payload.createdAt as string) ?? new Date().toISOString(),
  };
}

function notifyListeners(entry: Entry, events: string[]) {
  for (const listener of listeners) {
    listener(entry, events);
  }
}

async function openSubscription(): Promise<RealtimeSubscription | null> {
  if (!APPWRITE.databaseId || !APPWRITE.collectionId) {
    return null;
  }

  await ensureGuestSession();

  const realtime = getRealtime();
  const channels = getEntryChannels();

  try {
    const subscription = await realtime.subscribe(channels, (response) => {
      const payload = response.payload as Record<string, unknown> | undefined;
      if (!payload?.$id) return;
      notifyListeners(mapPayload(payload), response.events);
    });
    return subscription;
  } catch (err) {
    console.warn("[realtime] subscribe failed:", err);
    return null;
  }
}

async function ensureSharedSubscription(): Promise<boolean> {
  if (activeSubscription) return true;
  if (!subscribePromise) {
    subscribePromise = openSubscription().finally(() => {
      subscribePromise = null;
    });
  }
  const sub = await subscribePromise;
  if (sub) {
    activeSubscription = sub;
    return true;
  }
  return false;
}

export type SubscribeResult = {
  unsubscribe: () => void;
  /** True when Appwrite WebSocket subscription is active */
  connected: boolean;
};

/**
 * Subscribe to table row events (singleton — safe with React Strict Mode).
 */
export async function subscribeToEntries(
  onEvent: EntryRealtimeHandler,
): Promise<SubscribeResult> {
  listeners.add(onEvent);

  const connected = await ensureSharedSubscription();
  if (!connected && listeners.size === 1) {
    console.warn(
      "[realtime] WebSocket unavailable — enable Realtime in Appwrite Console or use polling",
    );
  }

  return {
    connected,
    unsubscribe: () => {
      listeners.delete(onEvent);
      if (listeners.size === 0 && activeSubscription) {
        void activeSubscription.close();
        activeSubscription = null;
      }
    },
  };
}

/** Tear down shared WebSocket (e.g. full app unmount). */
export function closeEntriesRealtime(): void {
  listeners.clear();
  if (activeSubscription) {
    void activeSubscription.close();
    activeSubscription = null;
  }
}
