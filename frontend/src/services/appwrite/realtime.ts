import { Channel, Query, Realtime, type RealtimeSubscription } from "appwrite";
import { APPWRITE } from "@/lib/constants";
import { getAppwriteClient } from "@/services/appwrite/client";
import { ensureGuestSession } from "@/services/appwrite/auth";
import type { Entry } from "@/types/entry";

export type EntryRealtimeHandler = (entry: Entry, event: string[]) => void;

let realtimeService: Realtime | null = null;
let wsErrorLogged = false;

function getRealtimeService(): Realtime {
  if (!realtimeService) {
    realtimeService = new Realtime(getAppwriteClient());
    realtimeService.onError((err, code) => {
      if (!wsErrorLogged) {
        console.warn(
          "[realtime] WebSocket error — live updates use polling:",
          err?.message ?? code,
        );
        wsErrorLogged = true;
      }
    });
  }
  return realtimeService;
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

function parseEntryPayload(
  payload: Record<string, unknown> | undefined,
): Entry | null {
  if (!payload || typeof payload.$id !== "string") return null;
  return mapPayload(payload);
}

function isDeleteEvent(events: string[]): boolean {
  return events.some(
    (e) => e.includes(".delete") || e.endsWith(".rows.delete"),
  );
}

export type SubscribeResult = {
  unsubscribe: () => void;
  /** True when Appwrite WebSocket subscription was created */
  connected: boolean;
};

/**
 * Subscribe to entry row events for one room (filtered server-side when supported).
 */
export async function subscribeToEntries(
  roomId: string,
  onEvent: EntryRealtimeHandler,
): Promise<SubscribeResult> {
  if (!APPWRITE.databaseId || !APPWRITE.collectionId || !roomId.trim()) {
    return { connected: false, unsubscribe: () => undefined };
  }

  await ensureGuestSession();

  const channel = Channel.tablesdb(APPWRITE.databaseId)
    .table(APPWRITE.collectionId)
    .row();

  try {
    const realtime = getRealtimeService();
    const subscription: RealtimeSubscription = await realtime.subscribe(
      [channel],
      (response) => {
        const entry = parseEntryPayload(
          response.payload as Record<string, unknown> | undefined,
        );
        if (!entry || entry.roomId !== roomId) return;
        onEvent(entry, response.events ?? []);
      },
      [Query.equal("roomId", roomId)],
    );

    return {
      connected: true,
      unsubscribe: () => {
        void subscription.unsubscribe();
      },
    };
  } catch (err) {
    console.warn("[realtime] subscribe failed:", err);
    return { connected: false, unsubscribe: () => undefined };
  }
}

/** Full teardown (e.g. logout). Prefer per-hook `unsubscribe()` during normal navigation. */
export async function closeEntriesRealtime(): Promise<void> {
  if (realtimeService) {
    await realtimeService.disconnect();
    realtimeService = null;
    wsErrorLogged = false;
  }
}
