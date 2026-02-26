"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { authService } from "@/services/authService";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await authService.forgotPassword(email);
      setMessage("Check your email for reset instructions.");
    } catch (err) {
      setMessage(err?.data?.error ?? err?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-[#FFFFFF] pl-[4rem] pr-[4rem] pb-[3rem] flex flex-col">
      <div className="max-w-md w-full mx-auto py-8 flex flex-col gap-8">
        <div>
          <img className="" src="/images/logo/logo.png" alt="Logo" />
        </div>
        <div>
          <div className="mb-8">
            <h1 className="font-inter font-[700] text-[24px] leading-[25px]">Forgot Password?</h1>
            <p className="text-gray-300 text-[12px] pt-2">
              No worries! Enter your email and we&apos;ll send you reset instructions.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {message && <p className="text-sm text-gray-300">{message}</p>}
            <div className="flex flex-col">
              <label className="font-bold text-[12px]" htmlFor="email">Email Address</label>
              <input
                className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600"
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-center mt-6 w-full">
              <Button type="submit" variant="primary" size="md" className="w-full !justify-center" disabled={loading}>
                {loading ? "Sending…" : "Reset Password"}
              </Button>
            </div>
          </form>
          <p className="font-carlito text-sm sm:text-xs flex justify-center text-gray-600 mt-6">
            <Link href="/auth/sign-in" className="text-[#FF676A] hover:underline flex items-center gap-1">
              ← Back to Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
