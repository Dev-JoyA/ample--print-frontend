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
                        <h1 className="font-inter font-[700] text-[24px] leading-[25px]">Join the elite</h1>
                        <p className="text-gray-300 text-[12px] pt-2 -mb-[1rem]">Start printing with the highest industry standards.</p>
                    </div>
                    <div>
                        <div className="flex flex-row justify-center border border-gray-700 rounded-lg px-4 py-1 my-[2rem] cursor-pointer hover:bg-gray-800">
                            <img className="pr-[0.5rem]" src="/images/icons/google.png" alt="Google logo" />
                            <p className="pl-[0.5rem] font-[700] ">Continue with Google</p>
                        </div>
                        {/* Fixed: Made the lines take full width */}
                        <div className="flex items-center justify-center gap-4 -mt-3 mb-[2rem] w-full">
                            <span className="h-px flex-1 bg-gray-600"></span>
                            <p className="text-gray-400 text-sm whitespace-nowrap">
                                OR CONTINUE WITH EMAIL
                            </p>
                            <span className="h-px flex-1 bg-gray-600"></span>
                        </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="font-bold text-[12px]" htmlFor="fname">FirstName/Company Name</label>
                                <input className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" type="text" id="fname" name="fname" placeholder="Enter your first name or company name" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-bold text-[12px]" htmlFor="lname">Last Name</label>
                                <input className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" type="text" id="lname" name="lname" placeholder="Enter your last name" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-bold text-[12px]" htmlFor="email">Email</label>
                                <input className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" type="email" id="email" name="email" placeholder="Enter your email" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-bold text-[12px]" htmlFor="phone">Phone Number</label>
                                <input className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" type="tel" id="phone" name="phone" placeholder="Enter your phone number" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-bold text-[12px]" htmlFor="username">Username</label>
                                <input className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" type="text" id="username" name="username" placeholder="Enter your username" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-bold text-[12px]" htmlFor="password">Password</label>
                                <input className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" type="password" id="password" name="password" placeholder="Enter your password" required />
                            </div>
                            <div className="md:col-span-2 flex flex-col">
                                <label className="font-bold text-[12px]" htmlFor="address">Address</label>
                                <input className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" id="address" name="address" placeholder="Enter your address" required></input>
                            </div>
                            {/* Fixed: Made checkbox label stretch full width */}
                            <div className="md:col-span-2 flex items-center gap-2 mt-4 w-full">
                                <input className="w-4 h-4 border-gray-700 rounded flex-shrink-0" type="checkbox" id="terms" name="terms" required />
                                <label htmlFor="terms" className="text-sm flex-1">
                                    I agree to the <Link className="text-red-600" href="/terms-of-service">Terms of Service</Link> and <Link className="text-red-600" href="/privacy-policy" >Privacy Policy</Link>
                                </label>
                            </div>
                        </div>
                       {/* Fixed: Made button full width with centered text */}
                       <div className="flex justify-center mt-6 w-full">
                            <Button variant="primary" size="md" icon="→" iconPosition="right" className="w-full !justify-center">
                                Create Account
                            </Button>
                        </div>
                    </div>
                    <p className="font-carlito text-sm sm:text-xs flex justify-center text-gray-600 mt-4">
                        Already have an account?{" "}
                        <Link href="/sign-in" className="text-[#FF676A] hover:underline ">
                            Sign in
                        </Link>
                    </p>
               </div>
            </div>
        </div>
    );
}

export default Page;