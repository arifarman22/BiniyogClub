import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "bc_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, cookieOptions);
}

export async function getSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value;
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  // Overwrite with expired cookie — most reliable cross-browser approach
  store.set(SESSION_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
}
