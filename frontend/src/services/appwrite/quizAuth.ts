import { ID } from "appwrite";
import { getAccount } from "@/services/appwrite/auth";

export interface QuizAuthUser {
  id: string;
  email: string;
  name: string;
}

/** Current account user (email+password) or null when only anonymous. */
export async function getQuizAuthUser(): Promise<QuizAuthUser | null> {
  const account = getAccount();
  try {
    const user = await account.get();
    return {
      id: user.$id,
      email: user.email ?? "",
      name: user.name ?? "",
    };
  } catch {
    return null;
  }
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<QuizAuthUser> {
  const account = getAccount();
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

export async function logoutQuizAuth(): Promise<void> {
  const account = getAccount();
  try {
    await account.deleteSession("current");
  } catch {
    // Already logged out.
  }
}
