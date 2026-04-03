"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { authService } from "@/services/authService";
import { setAuthCookies } from "@/app/lib/auth";
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';

const Page = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const googleUser = sessionStorage.getItem('googleUser');
    if (googleUser) {
      try {
        const userData = JSON.parse(googleUser);
        const token = userData.token || userData.accessToken;
        const refreshToken = userData.refreshToken;
        
        if (token) {
          setAuthCookies(token, refreshToken);
          sessionStorage.removeItem('googleUser');
          
          const role = userData.user?.role?.toLowerCase();
          if (role === "superadmin") router.push("/dashboards/super-admin-dashboard");
          else if (role === "admin") router.push("/dashboards/admin-dashboard");
          else router.push("/dashboards");
        }
      } catch (err) {
        console.error('Failed to parse Google user data:', err);
      }
    }
  }, [router]);

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
        else router.push("/dashboards");
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      setError(err?.data?.error ?? err?.message ?? "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <>
      <SEOHead {...METADATA.auth.signIn} />
      <div className="min-h-screen bg-slate-950 text-[#FFFFFF] px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <div className="max-w-md w-full mx-auto py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
          <div>
            <img className="w-12 sm:w-auto" src="/images/logo/logo.png" alt="Ample Print Hub Logo" />
          </div>
          <div>
            <div>
              <h1 className="font-inter font-[700] text-xl sm:text-2xl leading-tight">Welcome back</h1>
              <p className="text-gray-300 text-xs sm:text-sm pt-2">Sign in to continue printing with the highest industry standards.</p>
            </div>
            <div>
              <button 
                onClick={handleGoogleSignIn}
                className="w-full flex flex-row justify-center items-center gap-2 border border-gray-700 rounded-lg px-4 py-2 my-6 sm:my-8 cursor-pointer hover:bg-gray-800 transition-colors"
              >
                <img className="w-5 h-5" src="/images/icons/google.png" alt="Google logo" />
                <p className="font-[700] text-sm">Continue with Google</p>
              </button>
              <div className="flex items-center justify-center gap-3 sm:gap-4 my-4 sm:my-6 w-full">
                <span className="h-px flex-1 bg-gray-600"></span>
                <p className="text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                  OR CONTINUE WITH EMAIL
                </p>
                <span className="h-px flex-1 bg-gray-600"></span>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                {error && (
                  <p className="text-red-500 text-sm bg-red-900/30 p-3 rounded-lg">{error}</p>
                )}
                
                <div className="flex flex-col">
                  <label className="font-bold text-xs sm:text-sm" htmlFor="email">Email</label>
                  <input 
                    className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 text-white text-sm sm:text-base" 
                    type="email" 
                    id="email" 
                    name="email" 
                    placeholder="Enter your email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="font-bold text-xs sm:text-sm" htmlFor="password">Password</label>
                  <div className="relative">
                    <input 
                      className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-red-600 text-white text-sm sm:text-base" 
                      type={showPassword ? "text" : "password"}
                      id="password" 
                      name="password" 
                      placeholder="Enter your password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <input 
                      className="w-4 h-4 border-gray-700 rounded flex-shrink-0" 
                      type="checkbox" 
                      id="remember" 
                      name="remember" 
                      disabled={isLoading}
                    />
                    <label htmlFor="remember" className="text-xs sm:text-sm text-gray-300">Remember me</label>
                  </div>
                  <Link href="/auth/forgot-password" className="text-xs sm:text-sm text-red-600 hover:underline">Forgot password?</Link>
                </div>
                
                <div className="flex justify-center mt-4 sm:mt-6 w-full">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="md" 
                    icon="→" 
                    iconPosition="right" 
                    className="w-full !justify-center" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in…" : "Sign In"}
                  </Button>
                </div>
              </form>
            </div>
                      
            <p className="font-carlito text-xs sm:text-sm flex justify-center text-gray-600 mt-4 sm:mt-6">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="text-[#FF676A] hover:underline ml-1">Sign up</Link>
            </p>

            <p className="text-center text-gray-600 text-xs mt-4 sm:mt-6 px-4">
              By signing in, you agree to our{" "}
              <Link href="/terms-of-service" className="text-red-600 hover:underline">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy-policy" className="text-red-600 hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;