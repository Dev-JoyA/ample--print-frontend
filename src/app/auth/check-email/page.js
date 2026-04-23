import Link from 'next/link';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';

const CheckEmailPage = () => {
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
            <div className="mb-6 text-center sm:mb-8">
              <div className="mb-3 flex justify-center sm:mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/20 sm:h-16 sm:w-16">
                  <span className="text-3xl sm:text-4xl">✉️</span>
                </div>
              </div>
              <h1 className="font-inter text-xl font-[700] leading-tight sm:text-2xl">
                Check your email
              </h1>
              <p className="pt-2 text-xs text-gray-300 sm:text-sm">
                We've sent a password reset link to
                <br />
                <span className="font-semibold text-white">user@example.com</span>
              </p>
            </div>
            <div>
              <div className="mt-4 flex w-full justify-center sm:mt-6">
                <Button variant="primary" size="md" className="w-full !justify-center">
                  Open email app
                </Button>
              </div>

              <div className="mt-5 flex w-full items-center justify-center gap-3 sm:mt-6 sm:gap-4">
                <span className="h-px flex-1 bg-gray-600"></span>
                <p className="whitespace-nowrap text-xs text-gray-400 sm:text-sm">
                  Didn't receive the email?
                </p>
                <span className="h-px flex-1 bg-gray-600"></span>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:mt-6">
                <Button variant="secondary" size="md" className="w-full !justify-center">
                  Click to resend
                </Button>
              </div>
            </div>
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

export default CheckEmailPage;
