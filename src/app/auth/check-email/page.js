import Link from "next/link";
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';

const CheckEmailPage = () => {
    return (
        <>
            <SEOHead {...METADATA.auth.forgotPassword} />
            <div className="min-h-screen bg-slate-950 text-[#FFFFFF] px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
                <div className="max-w-md w-full mx-auto py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
                    <div>
                        <img className="w-12 sm:w-auto" src="/images/logo/logo.png" alt="Ample Print Hub Logo" />
                    </div>
                    <div>
                        <div className="mb-6 sm:mb-8 text-center">
                            <div className="flex justify-center mb-3 sm:mb-4">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600/20 rounded-full flex items-center justify-center">
                                    <span className="text-3xl sm:text-4xl">✉️</span>
                                </div>
                            </div>
                            <h1 className="font-inter font-[700] text-xl sm:text-2xl leading-tight">Check your email</h1>
                            <p className="text-gray-300 text-xs sm:text-sm pt-2">
                                We've sent a password reset link to<br />
                                <span className="text-white font-semibold">user@example.com</span>
                            </p>
                        </div>
                        <div>
                            <div className="flex justify-center mt-4 sm:mt-6 w-full">
                                <Button variant="primary" size="md" className="w-full !justify-center">
                                    Open email app
                                </Button>
                            </div>
                            
                            <div className="flex items-center justify-center gap-3 sm:gap-4 mt-5 sm:mt-6 w-full">
                                <span className="h-px flex-1 bg-gray-600"></span>
                                <p className="text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                                    Didn't receive the email?
                                </p>
                                <span className="h-px flex-1 bg-gray-600"></span>
                            </div>

                            <div className="flex flex-col gap-3 mt-5 sm:mt-6">
                                <Button variant="secondary" size="md" className="w-full !justify-center">
                                    Click to resend
                                </Button>
                            </div>
                        </div>
                        <p className="font-carlito text-xs sm:text-sm flex justify-center text-gray-600 mt-6 sm:mt-8">
                            <Link href="/auth/sign-in" className="text-[#FF676A] hover:underline flex items-center gap-1">
                                ← Back to Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CheckEmailPage;