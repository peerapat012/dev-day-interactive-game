import { ID, type Models } from "appwrite";
import { getAccount } from "@/services/appwrite/auth";

export interface QuizAuthUser {
  id: string;
  email: string;
  name: string;
}

/** Current account user (email+password) or null when only anonymous. */
export async function getQuizAuthUser(): Promise<QuizAuthUser | null> {
  const account = getAccount();
  let user: Models.User<Models.Preferences>;
  try {
    user = await account.get();
  } catch {
    return null;
  }
  try {
    const sessions = await account.listSessions();
    const hasEmailSession = sessions.sessions.some(
      (session) => session.provider === "email",
    );
    if (!hasEmailSession) return null;
  } catch {
    return null;
  }
  return {
    id: user.$id,
    email: user.email ?? "",
    name: user.name ?? "",
  };
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<QuizAuthUser> {
  const account = getAccount();
  await ensureNoActiveSession();
  await account.createEmailPasswordSession(email, password);
  const user = await getQuizAuthUser();
  if (!user) throw new Error("Could not load account after login");
  return user;
}

/** Register a new email+password account and open a session for it. */
export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<QuizAuthUser> {
  const account = getAccount();
  await ensureNoActiveSession();
  await account.create({
    userId: ID.unique(),
    email,
    password,
    name: name.trim(),
  });
  await account.createEmailPasswordSession(email, password);
  const user = await getQuizAuthUser();
  if (!user) throw new Error("Could not load account after registration");
  return user;
}

/**
 * Appwrite forbids creating a session while another is active
 * ("Creation of a session is prohibited when a session is active").
 * The quiz host flow opens an anonymous session up front, so end it
 * before creating an email/password session.
 */
async function ensureNoActiveSession(): Promise<void> {
  const account = getAccount();
  try {
    await account.get();
    await account.deleteSession("current");
  } catch {
    // No active session — nothing to end.
  }
}

export async function logoutQuizAuth(): Promise<void> {
  const account = getAccount();
  try {
    await account.deleteSession("current");
  } catch {
    // Already logged out.
  }
}
