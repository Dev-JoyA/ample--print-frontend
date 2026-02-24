// app/reset-password/page.tsx
import Link from "next/link";
import Button from '@/components/ui/Button';

const ResetPasswordPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-[#FFFFFF] pl-[4rem] pr-[4rem] pb-[3rem] flex flex-col">
            <div className="max-w-md w-full mx-auto py-8 flex flex-col gap-8">
                <div>
                    <img className="" src="/images/logo/logo.png" alt="Logo" />
                </div>
                <div>
                    <div className="mb-8">
                        <h1 className="font-inter font-[700] text-[24px] leading-[25px]">Set new password</h1>
                        <p className="text-gray-300 text-[12px] pt-2">
                            Your new password must be different from previously used passwords.
                        </p>
                    </div>
                    <div>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col">
                                <label className="font-bold text-[12px]" htmlFor="new-password">New Password</label>
                                <input 
                                    className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" 
                                    type="password" 
                                    id="new-password" 
                                    name="new-password" 
                                    placeholder="Enter new password" 
                                    required 
                                />
                                <p className="text-gray-500 text-[10px] mt-1">
                                    Must be at least 8 characters
                                </p>
                            </div>
                            <div className="flex flex-col">
                                <label className="font-bold text-[12px]" htmlFor="confirm-password">Confirm Password</label>
                                <input 
                                    className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" 
                                    type="password" 
                                    id="confirm-password" 
                                    name="confirm-password" 
                                    placeholder="Confirm new password" 
                                    required 
                                />
                            </div>
                        </div>
                       
                        <div className="flex justify-center mt-6 w-full">
                            <Button variant="primary" size="md" className="w-full !justify-center">
                                Reset Password
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

export default ResetPasswordPage;