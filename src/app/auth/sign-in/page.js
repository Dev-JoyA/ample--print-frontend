"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { authService } from "@/services/authService";
import { setAuthCookies } from "@/app/lib/auth";

const Page = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const result = await authService.signIn(email, password);
      const token = result.token ?? result.accessToken;
      const refreshToken = result.refreshToken;
      if (token) {
        setAuthCookies(token, refreshToken);
        const role = result.user?.role?.toLowerCase();
        if (role === "superadmin") router.push("/dashboards/super-admin-dashboard");
        else if (role === "admin") router.push("/dashboards/admin-dashboard");
        else router.push("/dashboard");
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      setError(err?.data?.error ?? err?.message ?? "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-[#FFFFFF] pl-[4rem] pr-[4rem] pb-[3rem] flex flex-col">
      <div className="max-w-2xl w-full mx-auto py-8 flex flex-col gap-8">
        <div>
          <img className="" src="/images/logo/logo.png" alt="Logo" />
        </div>
        <div>
          <div>
            <h1 className="font-inter font-[700] text-[24px] leading-[25px]">Welcome back</h1>
            <p className="text-gray-300 text-[12px] pt-2 -mb-[1rem]">Sign in to continue printing with the highest industry standards.</p>
          </div>
          <div>
            <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1"}/auth/google`} className="flex flex-row justify-center border border-gray-700 rounded-lg px-4 py-1 my-[2rem] cursor-pointer hover:bg-gray-800">
              <img className="pr-[0.5rem]" src="/images/icons/google.png" alt="Google logo" />
              <p className="pl-[0.5rem] font-[700]">Continue with Google</p>
            </a>
            <div className="flex items-center justify-center gap-4 -mt-3 mb-[2rem] w-full">
              <span className="h-px flex-1 bg-gray-600"></span>
              <p className="text-gray-400 text-sm whitespace-nowrap">
                OR CONTINUE WITH EMAIL
              </p>
              <span className="h-px flex-1 bg-gray-600"></span>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex flex-col">
                <label className="font-bold text-[12px]" htmlFor="email">Email</label>
                <input className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" type="email" id="email" name="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex flex-col">
                <label className="font-bold text-[12px]" htmlFor="password">Password</label>
                <input className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" type="password" id="password" name="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <input className="w-4 h-4 border-gray-700 rounded flex-shrink-0" type="checkbox" id="remember" name="remember" />
                  <label htmlFor="remember" className="text-sm text-gray-300">Remember me</label>
                </div>
                <Link href="/auth/forgot-password" className="text-sm text-red-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="flex justify-center mt-6 w-full">
                <Button type="submit" variant="primary" size="md" icon="→" iconPosition="right" className="w-full !justify-center" disabled={isLoading}>
                  {isLoading ? "Signing in…" : "Sign In"}
                </Button>
              </div>
            </form>
          </div>
                    
          <p className="font-carlito text-sm sm:text-xs flex justify-center text-gray-600 mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="text-[#FF676A] hover:underline ml-1">Sign up</Link>
          </p>

                    {/* Optional: Add a demo credentials notice */}
                    <p className="text-center text-gray-600 text-xs mt-6">
                        By signing in, you agree to our{" "}
                        <Link href="/terms-of-service" className="text-red-600 hover:underline">Terms</Link>
                        {" "}and{" "}
                        <Link href="/privacy-policy" className="text-red-600 hover:underline">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Page;