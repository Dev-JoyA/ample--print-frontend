// app/check-email/page.tsx
import Link from "next/link";
import Button from '@/components/ui/Button';

const CheckEmailPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-[#FFFFFF] pl-[4rem] pr-[4rem] pb-[3rem] flex flex-col">
            <div className="max-w-md w-full mx-auto py-8 flex flex-col gap-8">
                <div>
                    <img className="" src="/images/logo/logo.png" alt="Logo" />
                </div>
                <div>
                    <div className="mb-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
                                <span className="text-4xl">✉️</span>
                            </div>
                        </div>
                        <h1 className="font-inter font-[700] text-[24px] leading-[25px]">Check your email</h1>
                        <p className="text-gray-300 text-[12px] pt-2">
                            We've sent a password reset link to<br />
                            <span className="text-white font-semibold">user@example.com</span>
                        </p>
                    </div>
                    <div>
                        <div className="flex justify-center mt-6 w-full">
                            <Button variant="primary" size="md" className="w-full !justify-center">
                                Open email app
                            </Button>
                        </div>
                        
                        <div className="flex items-center justify-center gap-4 mt-6 w-full">
                            <span className="h-px flex-1 bg-gray-600"></span>
                            <p className="text-gray-400 text-sm whitespace-nowrap">
                                Didn't receive the email?
                            </p>
                            <span className="h-px flex-1 bg-gray-600"></span>
                        </div>

                        <div className="flex flex-col gap-3 mt-6">
                            <Button variant="secondary" size="md" className="w-full !justify-center">
                                Click to resend
                            </Button>
                        </div>
                    </div>
                    <p className="font-carlito text-sm sm:text-xs flex justify-center text-gray-600 mt-6">
                        <Link href="/sign-in" className="text-[#FF676A] hover:underline flex items-center gap-1">
                            ← Back to Sign in
                        </Link>
                    </p>
               </div>
            </div>
        </div>
    );
}

export default CheckEmailPage;