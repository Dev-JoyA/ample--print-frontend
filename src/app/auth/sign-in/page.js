"use client";
import Link from "next/link";
import Button from '@/components/ui/Button';

const Page = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-[#FFFFFF] pl-[4rem] pr-[4rem] pb-[3rem] flex flex-col">
            <div className="max-w-2xl w-full mx-auto py-8 flex flex-col gap-8">
                <div>
                    <img className="" src="/images/logo/logo.png" alt="Logo" />
                </div>
                <div>
                    <div >
                        <h1 className="font-inter font-[700] text-[24px] leading-[25px]">Welcome back</h1>
                        <p className="text-gray-300 text-[12px] pt-2 -mb-[1rem]">Sign in to continue printing with the highest industry standards.</p>
                    </div>
                    <div>
                        <div className="flex flex-row justify-center border border-gray-700 rounded-lg px-4 py-1 my-[2rem] cursor-pointer hover:bg-gray-800">
                            <img className="pr-[0.5rem]" src="/images/icons/google.png" alt="Google logo" />
                            <p className="pl-[0.5rem] font-[700] ">Continue with Google</p>
                        </div>
                        <div className="flex items-center justify-center gap-4 -mt-3 mb-[2rem] w-full">
                            <span className="h-px flex-1 bg-gray-600"></span>
                            <p className="text-gray-400 text-sm whitespace-nowrap">
                                OR CONTINUE WITH EMAIL
                            </p>
                            <span className="h-px flex-1 bg-gray-600"></span>
                        </div>
                       <div className="grid grid-cols-1 gap-4">
                            <div className="flex flex-col">
                                <label className="font-bold text-[12px]" htmlFor="email">Email or Username</label>
                                <input className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" type="text" id="email" name="email" placeholder="Enter your email or username" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-bold text-[12px]" htmlFor="password">Password</label>
                                <input className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" type="password" id="password" name="password" placeholder="Enter your password" required />
                            </div>
                            
                            {/* Remember me and Forgot password row */}
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <input className="w-4 h-4 border-gray-700 rounded flex-shrink-0" type="checkbox" id="remember" name="remember" />
                                    <label htmlFor="remember" className="text-sm text-gray-300">
                                        Remember me
                                    </label>
                                </div>
                                <Link href="/forgot-password" className="text-sm text-red-600 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>
                       
                       <div className="flex justify-center mt-6 w-full">
                            <Button variant="primary" size="md" icon="→" iconPosition="right" className="w-full !justify-center">
                                Sign In
                            </Button>
                        </div>
                    </div>
                    
                    <p className="font-carlito text-sm sm:text-xs flex justify-center text-gray-600 mt-4">
                        Don't have an account?{" "}
                        <Link href="/sign-up" className="text-[#FF676A] hover:underline ml-1">
                            Sign up
                        </Link>
                    </p>

                    {/* Optional: Add a demo credentials notice */}
                    <p className="text-center text-gray-600 text-xs mt-6">
                        By signing in, you agree to our{" "}
                        <Link href="/terms-of-service" className="text-red-600 hover:underline">Terms</Link>
                        {" "}and{" "}
                        <Link href="/privacy-policy" className="text-red-600 hover:underline">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Page;