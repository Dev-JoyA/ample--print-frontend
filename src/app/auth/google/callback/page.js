"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthCookies } from "@/app/lib/auth";

function GoogleCallbackPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const refresh = params.get("refresh");

    if (!token || !refresh) {
      router.push("/auth/sign-in?error=missing_tokens");
      return;
    }

    setAuthCookies(token, refresh);

    // decode role?
    const userRole = params.get("role");

    if (userRole === "superadmin") router.push("/dashboards/super-admin-dashboard");
    else if (userRole === "admin") router.push("/dashboards/admin-dashboard");
    else router.push("/dashboards");

  }, [params]);

  return <p>Signing you in…</p>;
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<p>Signing you in…</p>}>
      <GoogleCallbackPageContent />
    </Suspense>
  );
}
