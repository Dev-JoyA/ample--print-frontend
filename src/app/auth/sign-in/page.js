'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { authService } from '@/services/authService';
import { setAuthCookies } from '@/app/lib/auth';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const googleUser = sessionStorage.getItem('googleUser');
    if (googleUser) {
      try {
        const parsed = JSON.parse(googleUser);
        const userData = parsed.data ?? parsed;
        const token = userData.accessToken ?? userData.token;
        const refreshToken = userData.refreshToken;

        if (token) {
          setAuthCookies(token, refreshToken);
          sessionStorage.removeItem('googleUser');

          const next = searchParams?.get('next');
          if (next && typeof next === 'string' && next.startsWith('/')) {
            router.push(next);
            return;
          }

          const role = userData.user?.role?.toLowerCase();
          if (role === 'superadmin') router.push('/dashboards/super-admin-dashboard');
          else if (role === 'admin') router.push('/dashboards/admin-dashboard');
          else router.push('/dashboards');
        }
      } catch (err) {
        console.error('Failed to parse Google user data:', err);
      }
    }
  }, [router, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await authService.signIn(email, password);

      const data = result.data ?? result;
      const token = data.accessToken ?? data.token;
      const refreshToken = data.refreshToken;
      const user = data.user;

      if (token) {
        setAuthCookies(token, refreshToken);

        const next = searchParams?.get('next');
        if (next && typeof next === 'string' && next.startsWith('/')) {
          router.push(next);
          return;
        }

        const role = user?.role?.toLowerCase();
        if (role === 'superadmin') router.push('/dashboards/super-admin-dashboard');
        else if (role === 'admin') router.push('/dashboards/admin-dashboard');
        else router.push('/dashboards');
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      setError(err?.data?.error ?? err?.message ?? 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1 ';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <>
      <SEOHead {...METADATA.auth.signIn} />
      <div className="flex min-h-screen flex-col bg-slate-950 px-4 py-8 text-[#FFFFFF] sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-6 sm:gap-8 sm:py-8">
          <div>
            <img
              className="w-12 sm:w-auto"
              src="/images/logo/logo.png"
              alt="Ample Print Hub Logo"
            />
          </div>
          <div>
            <div>
              <h1 className="font-inter text-xl font-[700] leading-tight sm:text-2xl">
                Welcome back
              </h1>
              <p className="pt-2 text-xs text-gray-300 sm:text-sm">
                Sign in to continue printing with the highest industry standards.
              </p>
            </div>
            <div>
              <button
                onClick={handleGoogleSignIn}
                className="my-6 flex w-full cursor-pointer flex-row items-center justify-center gap-2 rounded-lg border border-gray-700 px-4 py-2 transition-colors hover:bg-gray-800 sm:my-8"
              >
                <img className="h-5 w-5" src="/images/icons/google.png" alt="Google logo" />
                <p className="text-sm font-[700]">Continue with Google</p>
              </button>
              <div className="my-4 flex w-full items-center justify-center gap-3 sm:my-6 sm:gap-4">
                <span className="h-px flex-1 bg-gray-600"></span>
                <p className="whitespace-nowrap text-xs text-gray-400 sm:text-sm">
                  OR CONTINUE WITH EMAIL
                </p>
                <span className="h-px flex-1 bg-gray-600"></span>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                {error && (
                  <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-500">{error}</p>
                )}

                <div className="flex flex-col">
                  <label className="text-xs font-bold sm:text-sm" htmlFor="email">
                    Email
                  </label>
                  <input
                    className="rounded-lg border border-gray-700 bg-slate-950 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:text-base"
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
                  <label className="text-xs font-bold sm:text-sm" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-lg border border-gray-700 bg-slate-950 px-4 py-2 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:text-base"
                      type={showPassword ? 'text' : 'password'}
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      className="h-4 w-4 flex-shrink-0 rounded border-gray-700"
                      type="checkbox"
                      id="remember"
                      name="remember"
                      disabled={isLoading}
                    />
                    <label htmlFor="remember" className="text-xs text-gray-300 sm:text-sm">
                      Remember me
                    </label>
                  </div>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-red-600 hover:underline sm:text-sm"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="mt-4 flex w-full justify-center sm:mt-6">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    icon="→"
                    iconPosition="right"
                    className="w-full !justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in…' : 'Sign In'}
                  </Button>
                </div>
              </form>
            </div>

            <p className="mt-4 flex justify-center font-carlito text-xs text-gray-600 sm:mt-6 sm:text-sm">
              Don't have an account?{' '}
              <Link href="/auth/sign-up" className="ml-1 text-[#FF676A] hover:underline">
                Sign up
              </Link>
            </p>

            <p className="mt-4 px-4 text-center text-xs text-gray-600 sm:mt-6">
              By signing in, you agree to our{' '}
              <Link href="/terms-of-service" className="text-red-600 hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="text-red-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInPageContent />
    </Suspense>
  );
}
