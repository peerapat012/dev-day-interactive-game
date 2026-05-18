import { Client } from "appwrite";
import { APPWRITE } from "@/lib/constants";

let client: Client | null = null;

export function getAppwriteClient(): Client {
  if (!client) {
    if (!APPWRITE.endpoint || !APPWRITE.projectId) {
      throw new Error(
        "Missing Appwrite env: NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID",
      );
    }
    client = new Client()
      .setEndpoint(APPWRITE.endpoint)
      .setProject(APPWRITE.projectId);
  }
  return client;
}
