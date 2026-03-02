"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from '@/components/ui/Button';
import { adminService } from "@/services/adminService";
import { useAuthCheck } from "@/app/lib/auth";

const AdminManagementPage = () => {
    const router = useRouter();
    useAuthCheck();
    
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            console.log("📋 Fetching admins...");
            const data = await adminService.getAllAdmins();
            console.log("✅ Admins data:", data);
            
            // Ensure data is an array
            if (Array.isArray(data)) {
                setAdmins(data);
            } else {
                console.error("Data is not an array:", data);
                setAdmins([]);
            }
        } catch (error) {
            console.error("❌ Failed to fetch admins:", error);
            setError(error.message || "Failed to load admins. Please try again.");
            
            if (error.status === 401) {
                router.push("/auth/sign-in");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (email) => {
        if (confirm(`Are you sure you want to deactivate ${email}?`)) {
            try {
                setLoading(true);
                await adminService.deactivateAdmin(email);
                await fetchAdmins(); // Refresh the list
            } catch (error) {
                alert("Failed to deactivate admin: " + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleReactivate = async (email) => {
        try {
            setLoading(true);
            await adminService.reactivateAdmin(email);
            await fetchAdmins(); // Refresh the list
        } catch (error) {
            alert("Failed to reactivate admin: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format name - SIMPLIFIED
const formatName = (admin) => {
    // The user object already has firstName and lastName directly
    if (admin.firstName) {
        return `${admin.firstName} ${admin.lastName || ''}`.trim();
    }
    // Fallback to email username
    return admin.email?.split('@')[0] || 'Unknown';
};

    // Helper function to get username - SIMPLIFIED
    const formatUserName = (admin) => {
        // The user object already has userName directly
        if (admin.userName) {
            return admin.userName;
        }
        // Fallback to email username
        return admin.email?.split('@')[0] || 'N/A';
    };
    

    // Debug logging to see actual data structure
    console.log("Current admins state:", admins.map(a => ({
        email: a.email,
        role: a.role,
        isActive: a.isActive,
        profile: a.profile,
        // Log what we're getting from profile
        profileFirstName: a.profile?.firstName,
        profileLastName: a.profile?.lastName,
        profileUserName: a.profile?.userName
    })));

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-h-screen">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Admin Management</h1>
                    <p className="text-gray-400">Manage system administrators</p>
                </div>
                <Link href="/dashboards/super-admin-dashboard/admin-management/create-admin">
                    <Button variant="primary" size="md">
                        + Create New Admin
                    </Button>
                </Link>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                    Error: {error}
                </div>
            )}

            <div className="bg-slate-900 rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-950 border-b border-gray-800">
                        <tr>
                            <th className="text-left p-4 text-gray-400 font-medium">Name</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Username</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Role</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center p-8 text-gray-400">
                                    No admins found. Click "Create New Admin" to add one.
                                </td>
                            </tr>
                        ) : (
                            admins.map((admin) => (
                                <tr key={admin._id || admin.id || Math.random()} className="border-b border-gray-800 hover:bg-slate-800/50">
                                    <td className="p-4 text-white">
                                        {formatName(admin)}
                                    </td>
                                    <td className="p-4 text-gray-300">{admin.email}</td>
                                    <td className="p-4 text-gray-300">{formatUserName(admin)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            admin.role === 'SuperAdmin' 
                                                ? 'bg-purple-900/50 text-purple-400 border border-purple-700'
                                                : 'bg-blue-900/50 text-blue-400 border border-blue-700'
                                        }`}>
                                            {admin.role || 'Admin'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            admin.isActive 
                                                ? 'bg-green-900/50 text-green-400 border border-green-700' 
                                                : 'bg-red-900/50 text-red-400 border border-red-700'
                                        }`}>
                                            {admin.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {admin.role !== 'SuperAdmin' && (
                                            <>
                                                {admin.isActive ? (
                                                    <button 
                                                        onClick={() => handleDeactivate(admin.email)}
                                                        className="text-red-500 hover:text-red-400 text-sm font-medium"
                                                    >
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleReactivate(admin.email)}
                                                        className="text-green-500 hover:text-green-400 text-sm font-medium"
                                                    >
                                                        Reactivate
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {admin.role === 'SuperAdmin' && (
                                            <span className="text-gray-500 text-sm">Protected</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminManagementPage;