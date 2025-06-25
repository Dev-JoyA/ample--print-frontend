import { NextResponse } from "next/server";

export async function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const protectedRoutes = [
    "/dashboards/super-admin-dashboards",
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
      const verifyResponse = await fetch(
        `http://localhost:4001/auth/verify-token`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!verifyResponse.ok) {
        throw new Error("Invalid token");
      }

      const { user } = await verifyResponse.json();

      // Optional: Restrict super-admin routes to superadmin role
      if (
        request.nextUrl.pathname.startsWith("/dashboards/super-admin-dashboards") &&
        user.role !== "superadmin"
      ) {
        return NextResponse.redirect(new URL("/dashboards", request.url));
      }
    } catch (error) {
      console.error("Middleware token verification failed:", error.message);
      const response = NextResponse.redirect(
        new URL("/auth/sign-in", request.url)
      );
      response.cookies.delete("token");
      response.cookies.delete("refreshToken");
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