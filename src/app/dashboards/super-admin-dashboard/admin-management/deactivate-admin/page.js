"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SEOHead from "@/components/common/SEOHead";
import { authService } from "@/services/authService";
import { METADATA } from "@/lib/metadata";

const Page = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const confirmation = confirm("Are you sure you want to deactivate this admin?");
    if (!confirmation) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await authService.deactivateAdmin({ email });
      setMessage("Admin deactivated successfully");
      setTimeout(() => {
        router.push("/dashboards/super-admin-dashboard/admin-management");
      }, 1500);
    } catch (err) {
      setError(err?.data?.error ?? err?.message ?? "Failed to deactivate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead {...METADATA.dashboard.superAdmin} title="Deactivate Admin" />
      <DashboardLayout userRole="super-admin">
        <div className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <button
                onClick={() => router.back()}
                className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">Deactivate Admin</h1>
              <p className="mt-2 text-sm text-gray-400">Deactivate an administrator account</p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
              {error && (
                <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}
              {message && (
                <div className="mb-4 rounded-lg border border-green-700 bg-green-900/50 p-3 text-sm text-green-200">
                  {message}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-300">
                    Admin Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email"
                    className="w-full"
                    disabled={loading}
                  />
                </div>

                <Button
                  onClick={handleClick}
                  disabled={loading || !email.trim()}
                  className="w-full"
                  variant="danger"
                >
                  {loading ? "Deactivating..." : "Deactivate Admin"}
                </Button>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500">
                <p>Deactivated admins will lose access to the dashboard.</p>
                <p className="mt-1">They can be reactivated later.</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Page;