"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from '@/components/ui/Button';
import { authService } from "@/services/authService";
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';

function ResetPasswordPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!newPassword || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        
        if (!token) {
            setError("Invalid or missing reset token");
            return;
        }
        
        setLoading(true);
        setMessage("");
        setError("");
        
        try {
            await authService.effectForgotPassword(token, newPassword, confirmPassword);
            setMessage("Password reset successfully! Redirecting to sign in...");
            setTimeout(() => {
                router.push("/auth/sign-in");
            }, 2000);
        } catch (err) {
            setError(err?.data?.message ?? err?.message ?? "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SEOHead {...METADATA.auth.resetPassword} />
            <div className="min-h-screen bg-slate-950 text-[#FFFFFF] px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
                <div className="max-w-md w-full mx-auto py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
                    <div>
                        <img className="w-12 sm:w-auto" src="/images/logo/logo.png" alt="Ample Print Hub Logo" />
                    </div>
                    <div>
                        <div className="mb-6 sm:mb-8">
                            <h1 className="font-inter font-[700] text-xl sm:text-2xl leading-tight">Set new password</h1>
                            <p className="text-gray-300 text-xs sm:text-sm pt-2">
                                Your new password must be different from previously used passwords.
                            </p>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <p className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg mb-4">
                                    {error}
                                </p>
                            )}
                            {message && (
                                <p className="text-sm text-green-400 bg-green-900/30 p-3 rounded-lg mb-4">
                                    {message}
                                </p>
                            )}
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col">
                                    <label className="font-bold text-xs sm:text-sm" htmlFor="new-password">New Password</label>
                                    <input 
                                        className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 text-white text-sm sm:text-base" 
                                        type="password" 
                                        id="new-password" 
                                        name="new-password" 
                                        placeholder="Enter new password" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required 
                                    />
                                    <p className="text-gray-500 text-[10px] mt-1">
                                        Must be at least 8 characters
                                    </p>
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-bold text-xs sm:text-sm" htmlFor="confirm-password">Confirm Password</label>
                                    <input 
                                        className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 text-white text-sm sm:text-base" 
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
                            <div className="flex justify-center mt-5 sm:mt-6 w-full">
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    size="md" 
                                    className="w-full !justify-center" 
                                    disabled={loading}
                                >
                                    {loading ? "Resetting..." : "Reset Password"}
                                </Button>
                            </div>
                        </form>
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordPageContent />
        </Suspense>
    );
}