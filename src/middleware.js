import { NextResponse } from "next/server";
import { COOKIE_NAMES } from "@/lib/constants";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";
const VERIFY_PATH = "/auth/verify-token";

export async function middleware(request) {
  const token = request.cookies.get(COOKIE_NAMES.TOKEN)?.value;
  const protectedRoutes = [
    "/dashboards/super-admin-dashboard",
    "/dashboards/admin-dashboard",
    "/profile",
    "/settings",
    "/admin-management",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }

    try {
      const verifyResponse = await fetch(`${API_BASE_URL}${VERIFY_PATH}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!verifyResponse.ok) {
        throw new Error("Invalid token");
      }

      const { user } = await verifyResponse.json();

      if (
        request.nextUrl.pathname.startsWith("/dashboards/super-admin-dashboard") &&
        user?.role?.toLowerCase() !== "superadmin"
      ) {
        return NextResponse.redirect(new URL("/dashboards", request.url));
      }
    } catch (error) {
      console.error("Middleware token verification failed:", error?.message);
      const response = NextResponse.redirect(
        new URL("/auth/sign-in", request.url)
      );
      response.cookies.delete(COOKIE_NAMES.TOKEN);
      response.cookies.delete(COOKIE_NAMES.REFRESH_TOKEN);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboards/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin-management/:path*",
  ],
};
