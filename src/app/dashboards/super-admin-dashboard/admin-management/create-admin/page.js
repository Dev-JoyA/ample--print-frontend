"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from '@/components/ui/Button';
import { adminService } from "@/services/adminService";
import { useAuthCheck } from "@/app/lib/auth";

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
            
            // Clear form
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                userName: "",
                password: "",
                address: "",
            });
            
            // Wait a moment then redirect
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
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Create New Admin</h1>
                <p className="text-gray-400">Add a new administrator to the system</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                    Error: {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-200">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg p-6 border border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="font-bold text-[12px] text-gray-300 mb-1" htmlFor="firstName">
                            First Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                            className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 text-white" 
                            type="text" 
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Enter first name" 
                            required 
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="flex flex-col">
                        <label className="font-bold text-[12px] text-gray-300 mb-1" htmlFor="lastName">
                            Last Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                            className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 text-white" 
                            type="text" 
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Enter last name" 
                            required 
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="flex flex-col">
                        <label className="font-bold text-[12px] text-gray-300 mb-1" htmlFor="email">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input 
                            className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 text-white" 
                            type="email" 
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email" 
                            required 
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="flex flex-col">
                        <label className="font-bold text-[12px] text-gray-300 mb-1" htmlFor="userName">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <input 
                            className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 text-white" 
                            type="text" 
                            id="userName"
                            name="userName"
                            value={formData.userName}
                            onChange={handleChange}
                            placeholder="Enter username" 
                            required 
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="flex flex-col">
                        <label className="font-bold text-[12px] text-gray-300 mb-1" htmlFor="phoneNumber">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input 
                            className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 text-white" 
                            type="tel" 
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="Enter phone number" 
                            required 
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="flex flex-col">
                        <label className="font-bold text-[12px] text-gray-300 mb-1" htmlFor="password">
                            Temporary Password <span className="text-red-500">*</span>
                        </label>
                        <input 
                            className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 text-white" 
                            type="password" 
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter temporary password" 
                            required 
                            disabled={loading}
                            minLength={5}
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 5 characters</p>
                    </div>
                    
                    <div className="md:col-span-2 flex flex-col">
                        <label className="font-bold text-[12px] text-gray-300 mb-1" htmlFor="address">
                            Address
                        </label>
                        <input 
                            className="bg-slate-950 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 text-white" 
                            type="text" 
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter address (optional)"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
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
    );
};

export default CreateAdminPage;