"use client";
import Link from "next/link";

const Page = () => {
    return (
        <div className="min-h-screen bg-gray-950 text-[#FFFFFF] pl-[4rem] pr-[4rem] pb-[3rem] flex flex-col">
            <div className="pl-[10rem] pr-[10rem] py-[3rem] flex flex-col gap-8">
                <div>
                    <img className="" src="/images/logo/logo.png" alt="Logo" />
                </div>
                <div>
                    <div>
                        <h1 className="font-inter font-[700] text-[24px] leading-[25px]">Join the elite</h1>
                        <p className="font-[400]">Start printing with the highest industry standards.</p>
                    </div>
                    <div>
                        <div className="flex flex-row justify-center border border-gray-700 rounded-lg px-4 py-2 my-[2rem] cursor-pointer hover:bg-gray-800">
                            <img className="pr-[0.5rem]" src="/images/icons/google.png" alt="Google logo" />
                            <p className="pl-[0.5rem] font-[700]">Continue with Google</p>
                        </div>
                        <p>OR CONTINUE WITH EMAIL</p>
                        <div>
                            <div>
                                <label htmlFor="fname">FirstName/Company Name</label>
                                <input type="text" id="fname" name="fname" placeholder="Enter your first name or company name" required />
                            </div>
                            <div>
                                <label htmlFor="lname">Last Name</label>
                                <input type="text" id="lname" name="lname" placeholder="Enter your last name" required />
                            </div>
                            <div>
                                <label htmlFor="email">Email</label>
                                <input type="email" id="email" name="email" placeholder="Enter your email" required />
                            </div>
                            <div>
                                <label htmlFor="phone">Phone Number</label>
                                <input type="tel" id="phone" name="phone" placeholder="Enter your phone number" required />
                            </div>
                            <div>
                                <label htmlFor="username">Username</label>
                                <input type="text" id="username" name="username" placeholder="Enter your username" required />
                            </div>
                            <div>
                                <label htmlFor="password">Password</label>
                                <input type="password" id="password" name="password" placeholder="Enter your password" required />
                            </div>
                            <div>
                                <label htmlFor="address">Address</label>
                                <input type="text" id="address" name="address" placeholder="Enter your address" required />
                            </div>
                            <div>
                                <label htmlFor="terms">I agree to the <Link href="/terms-of-service">Terms of Service</Link> and <Link href="/privacy-policy">Privacy Policy</Link></label>
                                <input type="checkbox" id="terms" name="terms" required />
                            </div>
                        </div>
                        <button>Create Account</button>
                    </div>
                    <p className="font-carlito text-sm sm:text-xs text-center">
                        Already have an account?{" "}
                        <Link href="/sign-in" className="text-[#FF676A] hover:underline">
                            Sign in
                        </Link>
                    </p>
               </div>
            </div>
        </div>
    );
}

export default Page;