// app/reset-password/success/page.tsx
import Link from "next/link";
import Button from '@/components/ui/Button';

const PasswordResetSuccessPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-[#FFFFFF] pl-[4rem] pr-[4rem] pb-[3rem] flex flex-col">
            <div className="max-w-md w-full mx-auto py-8 flex flex-col gap-8">
                <div>
                    <img className="" src="/images/logo/logo.png" alt="Logo" />
                </div>
                <div>
                    <div className="mb-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
                                <span className="text-4xl">✓</span>
                            </div>
                        </div>
                        <h1 className="font-inter font-[700] text-[24px] leading-[25px]">Password reset successful!</h1>
                        <p className="text-gray-300 text-[12px] pt-2">
                            Your password has been successfully reset. You can now sign in with your new password.
                        </p>
                    </div>
                    <div>
                        <div className="flex justify-center mt-6 w-full">
                            <Link href="/sign-in" className="w-full">
                                <Button variant="primary" size="md" className="w-full !justify-center">
                                    Sign in now
                                </Button>
                            </Link>
                        </div>
                    </div>
               </div>
            </div>
        </div>
    );
}

export default PasswordResetSuccessPage;