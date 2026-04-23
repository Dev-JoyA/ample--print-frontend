'use client';

import Link from 'next/link';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { authService } from '@/services/authService';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await authService.forgotPassword(email);
      setMessage('Check your email for reset instructions.');
    } catch (err) {
      setMessage(err?.data?.error ?? err?.message ?? 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead {...METADATA.auth.forgotPassword} />
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
            <div className="mb-6 sm:mb-8">
              <h1 className="font-inter text-xl font-[700] leading-tight sm:text-2xl">
                Forgot Password?
              </h1>
              <p className="pt-2 text-xs text-gray-300 sm:text-sm">
                No worries! Enter your email and we'll send you reset instructions.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {message && (
                <p
                  className={`text-sm ${message.includes('Check') ? 'text-green-400' : 'text-red-400'} text-center`}
                >
                  {message}
                </p>
              )}
              <div className="flex flex-col">
                <label className="text-xs font-bold sm:text-sm" htmlFor="email">
                  Email Address
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
                />
              </div>
              <div className="mt-4 flex w-full justify-center sm:mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full !justify-center"
                  disabled={loading}
                >
                  {loading ? 'Sending…' : 'Reset Password'}
                </Button>
              </div>
            </form>
            <p className="mt-6 flex justify-center font-carlito text-xs text-gray-600 sm:mt-8 sm:text-sm">
              <Link
                href="/auth/sign-in"
                className="flex items-center gap-1 text-[#FF676A] hover:underline"
              >
                ← Back to Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
