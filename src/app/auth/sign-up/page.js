'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { authService } from '@/services/authService';
import { setAuthCookies } from '@/app/lib/auth';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';

const Page = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    userName: '',
    password: '',
    address: '',
  });

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
          if (role === 'superadmin') router.push('/dashboards/super-admin-dashboard');
          else if (role === 'admin') router.push('/dashboards/admin-dashboard');
          else router.push('/dashboards');
        }
      } catch (err) {
        console.error('Failed to parse Google user data:', err);
      }
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.signUp(formData);
      console.log('Sign up response:', response);
      router.push('/auth/sign-in?registered=true');
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <>
      <SEOHead {...METADATA.auth.signUp} />
      <div className="flex min-h-screen flex-col bg-slate-950 px-4 py-8 text-[#FFFFFF] sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6 sm:gap-8 sm:py-8">
          <div>
            <img
              className="w-12 sm:w-auto"
              src="/images/logo/logo.png"
              alt="Ample Print Hub Logo"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div>
            <div>
              <h1 className="font-inter text-xl font-[700] leading-tight sm:text-2xl">
                Join the elite
              </h1>
              <p className="pt-2 text-xs text-gray-300 sm:text-sm">
                Start printing with the highest industry standards.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div>
                <button
                  type="button"
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold sm:text-sm" htmlFor="firstName">
                      First Name/Company Name
                    </label>
                    <input
                      className="rounded-lg border border-gray-700 bg-slate-950 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:text-base"
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter your first name or company name"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold sm:text-sm" htmlFor="lastName">
                      Last Name
                    </label>
                    <input
                      className="rounded-lg border border-gray-700 bg-slate-950 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:text-base"
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold sm:text-sm" htmlFor="email">
                      Email
                    </label>
                    <input
                      className="rounded-lg border border-gray-700 bg-slate-950 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:text-base"
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold sm:text-sm" htmlFor="phoneNumber">
                      Phone Number
                    </label>
                    <input
                      className="rounded-lg border border-gray-700 bg-slate-950 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:text-base"
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold sm:text-sm" htmlFor="userName">
                      Username
                    </label>
                    <input
                      className="rounded-lg border border-gray-700 bg-slate-950 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:text-base"
                      type="text"
                      id="userName"
                      name="userName"
                      value={formData.userName}
                      onChange={handleChange}
                      placeholder="Enter your username"
                      required
                      disabled={loading}
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
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
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
                  <div className="flex flex-col md:col-span-2">
                    <label className="text-xs font-bold sm:text-sm" htmlFor="address">
                      Address
                    </label>
                    <input
                      className="rounded-lg border border-gray-700 bg-slate-950 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:text-base"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your address"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="mt-4 flex w-full items-center gap-2 md:col-span-2">
                    <input
                      className="h-4 w-4 flex-shrink-0 rounded border-gray-700"
                      type="checkbox"
                      id="terms"
                      name="terms"
                      required
                      disabled={loading}
                    />
                    <label htmlFor="terms" className="flex-1 text-xs text-gray-300 sm:text-sm">
                      I agree to the{' '}
                      <Link className="text-red-600 hover:underline" href="/terms-of-service">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link className="text-red-600 hover:underline" href="/privacy-policy">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>

                <div className="mt-5 flex w-full justify-center sm:mt-6">
                  <Button
                    variant="primary"
                    size="md"
                    icon="→"
                    iconPosition="right"
                    className="w-full !justify-center"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </div>
            </form>

            <p className="mt-4 flex justify-center font-carlito text-xs text-gray-600 sm:mt-6 sm:text-sm">
              Already have an account?{' '}
              <Link href="/auth/sign-in" className="ml-1 text-[#FF676A] hover:underline">
                Sign in
              </Link>
            </p>

            <p className="mt-4 px-4 text-center text-xs text-gray-600 sm:mt-6">
              By signing up, you agree to our{' '}
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
};

export default Page;
