import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Server-side function for protecting routes (unchanged)
export async function protectRoute() {
  const { cookies } = await import("next/headers");
  const token = cookies().get("token")?.value;

  if (!token) {
    redirect("/auth/sign-in");
  }

  try {
    const res = await fetch("http://localhost:4001/auth/verify-token", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("Invalid token");
    }
  } catch (error) {
    console.error("Protect route error:", error.message);
    redirect("/auth/sign-in");
  }
}

// Client-side hook for token verification
export function useAuthCheck() {
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
        console.warn("No token found, redirecting to sign-in page");
        alert("You need to sign in first.");
       router.push("/auth/sign-in");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch("http://localhost:4001/auth/verify-token", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Invalid token");
        }
      } catch (error) {
        console.error("Token verification failed:", error.message);
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie =
          "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/auth/sign-in");
      }
    };

    verifyToken();
  }, [router]);
}

// Token refresh function (unchanged)
export async function refreshToken() {
  try {
    const response = await fetch("http://localhost:4001/auth/refresh-token", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const { token } = await response.json();
    document.cookie = `token=${token}; path=/; max-age=3600; ${
      process.env.NODE_ENV === "production" ? "secure;" : ""
    } sameSite=strict`;

    return true;
  } catch (error) {
    console.error("Refresh token error:", error.message);
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/auth/sign-in";
    return false;
  }
}