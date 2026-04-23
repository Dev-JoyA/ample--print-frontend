'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { authService } from '@/services/authService';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      await authService.effectForgotPassword(token, newPassword, confirmPassword);
      setMessage('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        router.push('/auth/sign-in');
      }, 2000);
    } catch (err) {
      setError(err?.data?.message ?? err?.message ?? 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead {...METADATA.auth.resetPassword} />
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
                Set new password
              </h1>
              <p className="pt-2 text-xs text-gray-300 sm:text-sm">
                Your new password must be different from previously used passwords.
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              {error && (
                <p className="mb-4 rounded-lg bg-red-900/30 p-3 text-sm text-red-400">{error}</p>
              )}
              {message && (
                <p className="mb-4 rounded-lg bg-green-900/30 p-3 text-sm text-green-400">
                  {message}
                </p>
              )}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold sm:text-sm" htmlFor="new-password">
                    New Password
                  </label>
                  <input
                    className="rounded-lg border border-gray-700 bg-slate-950 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:text-base"
                    type="password"
                    id="new-password"
                    name="new-password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <p className="mt-1 text-[10px] text-gray-500">Must be at least 8 characters</p>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold sm:text-sm" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <input
                    className="rounded-lg border border-gray-700 bg-slate-950 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:text-base"
                    type="password"
                    id="confirm-password"
                    name="confirm-password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mt-5 flex w-full justify-center sm:mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full !justify-center"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
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
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
