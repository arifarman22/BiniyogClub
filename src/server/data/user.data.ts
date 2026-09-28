import { getSession } from "@/lib/auth/session";
import { userRepository } from "@/db/repositories";

/**
 * Data-access functions are called directly from Server Components.
 * They are NOT route handlers — they run on the server during rendering.
 * They may call getSession() to scope data to the current user.
 */

export async function getCurrentUser() {
  return getSession();
}

export async function getUserById(id: string) {
  return userRepository.findById(id);
}
