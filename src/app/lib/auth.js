import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { COOKIE_NAMES } from "@/lib/constants";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";
const VERIFY_PATH = "/auth/verify-token";
const REFRESH_PATH = "/auth/refresh-token";

const secure =
  typeof process !== "undefined" && process.env.NODE_ENV === "production";

/**
 * Server-side: protect a route by verifying the token cookie. Redirects to sign-in if invalid.
 */
export async function protectRoute() {
  const { cookies } = await import("next/headers");
  const token = cookies().get(COOKIE_NAMES.TOKEN)?.value;

  if (!token) {
    redirect("/auth/sign-in");
  }

  try {
    const res = await fetch(`${API_BASE_URL}${VERIFY_PATH}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("Invalid token");
    }
  } catch (error) {
    console.error("Protect route error:", error?.message);
    redirect("/auth/sign-in");
  }
}

/**
 * Client-side hook: verify token and redirect to sign-in if missing/invalid.
 */
export function useAuthCheck() {
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAMES.TOKEN}=`))
      ?.split("=")[1];

    if (!token) {
      console.warn("No token found, redirecting to sign-in page");
      if (typeof alert !== "undefined") alert("You need to sign in first.");
      router.push("/auth/sign-in");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}${VERIFY_PATH}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Invalid token");
        }
      } catch (error) {
        console.error("Token verification failed:", error?.message);
        document.cookie = `${COOKIE_NAMES.TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        router.push("/auth/sign-in");
      }
    };

    verifyToken();
  }, [router]);
}

/**
 * Refresh access token using refresh token from cookie. Call from client when API returns 401.
 * Sets new token (and refreshToken if returned) in cookies. Redirects to sign-in on failure.
 */
export async function refreshToken() {
  const refreshTokenValue =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${COOKIE_NAMES.REFRESH_TOKEN}=`))
          ?.split("=")[1]
      : null;

  if (!refreshTokenValue) {
    if (typeof window !== "undefined") {
      document.cookie = `${COOKIE_NAMES.TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      window.location.href = "/auth/sign-in";
    }
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    const newToken = data.token ?? data.accessToken;
    const newRefresh = data.refreshToken;

    if (typeof document !== "undefined" && newToken) {
      document.cookie = `${COOKIE_NAMES.TOKEN}=${encodeURIComponent(newToken)}; path=/; max-age=3600; ${secure ? "secure;" : ""} sameSite=strict`;
      if (newRefresh) {
        document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=${encodeURIComponent(newRefresh)}; path=/; max-age=604800; ${secure ? "secure;" : ""} sameSite=strict`;
      }
    }

    return true;
  } catch (error) {
    console.error("Refresh token error:", error?.message);
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_NAMES.TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      window.location.href = "/auth/sign-in";
    }
    return false;
  }
}

/**
 * Set auth cookies (token and optionally refreshToken). Use after sign-in/sign-up.
 */
export function setAuthCookies(token, refreshToken) {
  if (typeof document === "undefined") return;
  const opts = `path=/; max-age=3600; ${secure ? "secure;" : ""} sameSite=strict`;
  document.cookie = `${COOKIE_NAMES.TOKEN}=${encodeURIComponent(token)}; ${opts}`;
  if (refreshToken) {
    document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=${encodeURIComponent(refreshToken)}; path=/; max-age=604800; ${secure ? "secure;" : ""} sameSite=strict`;
  }
}
