"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from '@/components/ui/Button';
import { authService } from "@/services/authService";
import { setAuthCookies } from "@/app/lib/auth";

const Page = () => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        userName: '',
        password: '',
        address: ''
    });

    // Check for Google OAuth callback on page load
    useEffect(() => {
        // Check if we have user data in sessionStorage (from Google callback)
        const googleUser = sessionStorage.getItem('googleUser');
        if (googleUser) {
            try {
                const userData = JSON.parse(googleUser);
                const token = userData.token || userData.accessToken;
                const refreshToken = userData.refreshToken;
                
                if (token) {
                    setAuthCookies(token, refreshToken);
                    sessionStorage.removeItem('googleUser');
                    
                    const role = userData.user?.role?.toLowerCase();
                    if (role === "superadmin") router.push("/dashboards/super-admin-dashboard");
                    else if (role === "admin") router.push("/dashboards/admin-dashboard");
                    else router.push("/dashboard");
                }
            } catch (err) {
                console.error('Failed to parse Google user data:', err);
            }
        }
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authService.signUp(formData);
            console.log('Sign up response:', response);
            
            // Redirect to sign-in or dashboard based on response
            router.push('/auth/sign-in?registered=true');
        } catch (err) {
            console.error('Sign up error:', err);
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";
        window.location.href = `${apiUrl}/auth/google`; // ⚠️ Backend handles OAuth
    };

    return (
        <div className="min-h-screen bg-slate-950 text-[#FFFFFF] pl-[4rem] pr-[4rem] pb-[3rem] flex flex-col">
            <div className="max-w-2xl w-full mx-auto py-8 flex flex-col gap-8">
                <div>
                    <img className="" src="/images/logo/logo.png" alt="Logo" />
                </div>
                
                {error && (
                    <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <div>
                        <h1 className="font-inter font-[700] text-[24px] leading-[25px]">Join the elite</h1>
                        <p className="text-gray-300 text-[12px] pt-2 -mb-[1rem]">Start printing with the highest industry standards.</p>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div>
                            <button 
                                type="button"
                                onClick={handleGoogleSignIn}
                                className="w-full flex flex-row justify-center border border-gray-700 rounded-lg px-4 py-1 my-[2rem] cursor-pointer hover:bg-gray-800 transition-colors"
                            >
                                <img className="pr-[0.5rem]" src="/images/icons/google.png" alt="Google logo" />
                                <p className="pl-[0.5rem] font-[700] ">Continue with Google</p>
                            </button>
                            
                            <div className="flex items-center justify-center gap-4 -mt-3 mb-[2rem] w-full">
                                <span className="h-px flex-1 bg-gray-600"></span>
                                <p className="text-gray-400 text-sm whitespace-nowrap">
                                    OR CONTINUE WITH EMAIL
                                </p>
                                <span className="h-px flex-1 bg-gray-600"></span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="font-bold text-[12px]" htmlFor="firstName">First Name/Company Name</label>
                                    <input 
                                        className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" 
                                        type="text" 
                                        id="firstName" 
                                        name="firstName" 
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="Enter your first name or company name" 
                                        required 
                                        disabled={loading}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-bold text-[12px]" htmlFor="lastName">Last Name</label>
                                    <input 
                                        className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" 
                                        type="text" 
                                        id="lastName" 
                                        name="lastName" 
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Enter your last name" 
                                        required 
                                        disabled={loading}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-bold text-[12px]" htmlFor="email">Email</label>
                                    <input 
                                        className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" 
                                        type="email" 
                                        id="email" 
                                        name="email" 
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email" 
                                        required 
                                        disabled={loading}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-bold text-[12px]" htmlFor="phoneNumber">Phone Number</label>
                                    <input 
                                        className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" 
                                        type="tel" 
                                        id="phoneNumber" 
                                        name="phoneNumber" 
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="Enter your phone number" 
                                        required 
                                        disabled={loading}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-bold text-[12px]" htmlFor="userName">Username</label>
                                    <input 
                                        className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" 
                                        type="text" 
                                        id="userName" 
                                        name="userName" 
                                        value={formData.userName}
                                        onChange={handleChange}
                                        placeholder="Enter your username" 
                                        required 
                                        disabled={loading}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-bold text-[12px]" htmlFor="password">Password</label>
                                    <div className="relative">
                                        <input 
                                            className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-gray-600" 
                                            type={showPassword ? "text" : "password"}
                                            id="password" 
                                            name="password" 
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Enter your password" 
                                            required 
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="md:col-span-2 flex flex-col">
                                    <label className="font-bold text-[12px]" htmlFor="address">Address</label>
                                    <input 
                                        className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600" 
                                        id="address" 
                                        name="address" 
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter your address" 
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="md:col-span-2 flex items-center gap-2 mt-4 w-full">
                                    <input 
                                        className="w-4 h-4 border-gray-700 rounded flex-shrink-0" 
                                        type="checkbox" 
                                        id="terms" 
                                        name="terms" 
                                        required 
                                        disabled={loading}
                                    />
                                    <label htmlFor="terms" className="text-sm flex-1">
                                        I agree to the <Link className="text-red-600 hover:underline" href="/terms-of-service">Terms of Service</Link> and <Link className="text-red-600 hover:underline" href="/privacy-policy" >Privacy Policy</Link>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex justify-center mt-6 w-full">
                                <Button 
                                    variant="primary" 
                                    size="md" 
                                    icon="→" 
                                    iconPosition="right" 
                                    className="w-full !justify-center"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </Button>
                            </div>
                        </div>
                    </form>
                    
                    <p className="font-carlito text-sm sm:text-xs flex justify-center text-gray-600 mt-4">
                        Already have an account?{" "}
                        <Link href="/auth/sign-in" className="text-[#FF676A] hover:underline ">
                            Sign in
                        </Link>
                    </p>

                    <p className="text-center text-gray-600 text-xs mt-6">
                        By signing up, you agree to our{" "}
                        <Link href="/terms-of-service" className="text-red-600 hover:underline">Terms</Link>
                        {" "}and{" "}
                        <Link href="/privacy-policy" className="text-red-600 hover:underline">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Page;