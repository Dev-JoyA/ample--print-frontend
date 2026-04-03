"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SEOHead from "@/components/common/SEOHead";
import { adminService } from "@/services/adminService";
import { useAuthCheck } from "@/app/lib/auth";
import { METADATA } from "@/lib/metadata";

const CreateAdminPage = () => {
    const router = useRouter();
    useAuthCheck();
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        userName: "",
        password: "",
        address: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        console.log("📝 Creating admin with data:", formData);

        try {
            const response = await adminService.createAdmin(formData);
            console.log("✅ Admin created successfully:", response);
            
            setSuccess("Admin created successfully! They will receive an email to set their password.");
            
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                userName: "",
                password: "",
                address: "",
            });
            
            setTimeout(() => {
                router.push("/dashboards/super-admin-dashboard/admin-management");
            }, 2000);
            
        } catch (err) {
            console.error("❌ Error creating admin:", err);
            setError(err.message || "Failed to create admin. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SEOHead {...METADATA.dashboard.superAdmin} title="Create New Admin" />
            <DashboardLayout userRole="super-admin">
                <div className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-6">
                            <button
                                onClick={() => router.back()}
                                className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back
                            </button>
                            <h1 className="text-3xl font-bold text-white sm:text-4xl">Create New Admin</h1>
                            <p className="mt-2 text-sm text-gray-400">Add a new administrator to the system</p>
                        </div>

                        {error && (
                            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
                                Error: {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 rounded-lg border border-green-700 bg-green-900/50 p-3 text-sm text-green-200">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="flex flex-col">
                                    <label className="mb-1 text-xs font-bold text-gray-300" htmlFor="firstName">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="Enter first name"
                                        required
                                        disabled={loading}
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="flex flex-col">
                                    <label className="mb-1 text-xs font-bold text-gray-300" htmlFor="lastName">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Enter last name"
                                        required
                                        disabled={loading}
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="flex flex-col">
                                    <label className="mb-1 text-xs font-bold text-gray-300" htmlFor="email">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter email"
                                        required
                                        disabled={loading}
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="flex flex-col">
                                    <label className="mb-1 text-xs font-bold text-gray-300" htmlFor="userName">
                                        Username <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        id="userName"
                                        name="userName"
                                        value={formData.userName}
                                        onChange={handleChange}
                                        placeholder="Enter username"
                                        required
                                        disabled={loading}
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="flex flex-col">
                                    <label className="mb-1 text-xs font-bold text-gray-300" htmlFor="phoneNumber">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                        required
                                        disabled={loading}
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="flex flex-col">
                                    <label className="mb-1 text-xs font-bold text-gray-300" htmlFor="password">
                                        Temporary Password <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter temporary password"
                                        required
                                        disabled={loading}
                                        minLength={5}
                                        className="w-full"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Minimum 5 characters</p>
                                </div>
                                
                                <div className="flex flex-col md:col-span-2">
                                    <label className="mb-1 text-xs font-bold text-gray-300" htmlFor="address">
                                        Address
                                    </label>
                                    <Input
                                        type="text"
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter address (optional)"
                                        disabled={loading}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <Button
                                    variant="secondary"
                                    size="md"
                                    onClick={() => router.back()}
                                    type="button"
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="md"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? "Creating..." : "Create Admin"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DashboardLayout>
        </>
    );
};

export default CreateAdminPage;