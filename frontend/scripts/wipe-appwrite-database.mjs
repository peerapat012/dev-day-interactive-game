/**
 * Wipe all rows from Appwrite TablesDB: entries, guests, rooms.
 *
 * Requires frontend/.env.local (or env vars) with:
 *   APPWRITE_API_KEY          — API key with TablesDB delete scope
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT
 *   NEXT_PUBLIC_APPWRITE_PROJECT_ID
 *   NEXT_PUBLIC_APPWRITE_DATABASE_ID
 *   NEXT_PUBLIC_APPWRITE_COLLECTION_ID   (entries table)
 *   NEXT_PUBLIC_APPWRITE_GUESTS_TABLE_ID (optional, default guests)
 *   NEXT_PUBLIC_APPWRITE_ROOMS_TABLE_ID  (optional, default rooms)
 *
 * Usage (from frontend/):
 *   CONFIRM_WIPE=yes node scripts/wipe-appwrite-database.mjs
 *
 * After running: clear browser storage for the app (localStorage) or hosts will
 * keep stale room codes / guest ids until they refresh.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const path = resolve(__dirname, "../.env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.replace(/\/$/, "");
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const entriesTable = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;
const guestsTable =
  process.env.NEXT_PUBLIC_APPWRITE_GUESTS_TABLE_ID?.trim() || "guests";
const roomsTable =
  process.env.NEXT_PUBLIC_APPWRITE_ROOMS_TABLE_ID?.trim() || "rooms";

if (process.env.CONFIRM_WIPE !== "yes") {
  console.error(
    'Refusing to run: set CONFIRM_WIPE=yes to delete all rows in entries, guests, and rooms tables.',
  );
  process.exit(1);
}

if (!endpoint || !projectId || !apiKey || !databaseId || !entriesTable) {
  console.error(
    "Missing env. Need APPWRITE_API_KEY and NEXT_PUBLIC_APPWRITE_* from .env.local.",
  );
  process.exit(1);
}

async function deleteAllRows(tableId) {
  const url = `${endpoint}/tablesdb/${databaseId}/tables/${encodeURIComponent(tableId)}/rows`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
    },
    body: JSON.stringify({ queries: [] }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${tableId}: ${res.status} ${text}`);
  }
}

async function main() {
  console.log(`Database: ${databaseId}`);
  for (const label of [
    ["entries", entriesTable],
    ["guests", guestsTable],
    ["rooms", roomsTable],
  ]) {
    const [name, id] = label;
    process.stdout.write(`Deleting all rows in ${name} (${id})… `);
    try {
      await deleteAllRows(id);
      console.log("ok");
    } catch (e) {
      console.log("failed");
      throw e;
    }
  }
  console.log("\nDone. Clear site localStorage in browsers (word-cloud-player, word-cloud-room) if needed.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
