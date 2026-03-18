"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from '@/components/ui/Button';
import { adminService } from "@/services/adminService";
import { designService } from "@/services/designService";
import { useAuthCheck } from "@/app/lib/auth";

const AdminManagementPage = () => {
    const router = useRouter();
    useAuthCheck();
    
    // State for active tab
    const [activeTab, setActiveTab] = useState('admins');
    
    // State for admins list
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // State for designs
    const [designs, setDesigns] = useState([]);
    const [designsLoading, setDesignsLoading] = useState(false);
    const [designsError, setDesignsError] = useState("");
    const [designStats, setDesignStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        byAdmin: {}
    });
    
    // Pagination for designs
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);

    // Filter state
    const [filters, setFilters] = useState({
        adminId: '',
        isApproved: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    useEffect(() => {
        if (activeTab === 'designs') {
            fetchDesigns();
        }
    }, [activeTab, currentPage, filters.adminId, filters.isApproved, filters.startDate, filters.endDate]);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            console.log("📋 Fetching admins...");
            const data = await adminService.getAllAdmins();
            console.log("✅ Admins data:", data);
            
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

        const fetchDesigns = async () => {
        try {
            setDesignsLoading(true);
            setDesignsError("");
            
            // Build filter params
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                ...(filters.adminId && { uploadedBy: filters.adminId }),
                ...(filters.isApproved !== '' && { isApproved: filters.isApproved === 'true' }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate })
            };
            
            console.log("📋 Fetching designs with params:", params);
            
            const response = await designService.getAll(params);
            console.log("✅ Designs response:", response);
            
            // Handle the response structure from your backend
            // Based on getAllDesignsController: { success: true, data: [...], total, page, limit, pages }
            let designsData = [];
            let total = 0;
            
            if (response?.data && Array.isArray(response.data)) {
                designsData = response.data;
                total = response.total || designsData.length;
                setTotalPages(response.pages || Math.ceil(total / itemsPerPage) || 1);
            } else if (Array.isArray(response)) {
                designsData = response;
                total = designsData.length;
                setTotalPages(Math.ceil(total / itemsPerPage) || 1);
            } else if (response?.designs && Array.isArray(response.designs)) {
                designsData = response.designs;
                total = response.total || designsData.length;
                setTotalPages(Math.ceil(total / itemsPerPage) || 1);
            }
            
            setDesigns(designsData);
            calculateDesignStats(designsData);
            
        } catch (error) {
            console.error("❌ Failed to fetch designs:", error);
            setDesignsError("Failed to load designs. Please try again.");
            setDesigns([]);
            setDesignStats({ total: 0, approved: 0, pending: 0, byAdmin: {} });
        } finally {
            setDesignsLoading(false);
        }
    };

    const calculateDesignStats = (designsData) => {
        const approved = designsData.filter(d => d.isApproved).length;
        const pending = designsData.filter(d => !d.isApproved).length;
        
        // Group by admin
        const byAdmin = {};
        designsData.forEach(design => {
            const adminId = design.uploadedBy?._id || design.uploadedBy;
            const adminName = design.uploadedBy?.email?.split('@')[0] || 'Unknown';
            
            if (!byAdmin[adminId]) {
                byAdmin[adminId] = {
                    name: adminName,
                    count: 0,
                    approved: 0
                };
            }
            byAdmin[adminId].count++;
            if (design.isApproved) {
                byAdmin[adminId].approved++;
            }
        });
        
        setDesignStats({
            total: designsData.length,
            approved,
            pending,
            byAdmin
        });
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            adminId: '',
            isApproved: '',
            startDate: '',
            endDate: ''
        });
        setCurrentPage(1);
    };

    const handleDeactivate = async (email) => {
        if (confirm(`Are you sure you want to deactivate ${email}?`)) {
            try {
                setLoading(true);
                await adminService.deactivateAdmin(email);
                await fetchAdmins();
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
            await fetchAdmins();
        } catch (error) {
            alert("Failed to reactivate admin: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format name
    const formatName = (admin) => {
        if (admin.firstName) {
            return `${admin.firstName} ${admin.lastName || ''}`.trim();
        }
        return admin.email?.split('@')[0] || 'Unknown';
    };

    // Helper function to get username
    const formatUserName = (admin) => {
        if (admin.userName) {
            return admin.userName;
        }
        return admin.email?.split('@')[0] || 'N/A';
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper function for status badge
    const getStatusBadge = (isApproved) => {
        return isApproved ? (
            <span key="status-approved" className="bg-green-900/50 text-green-400 px-2 py-1 rounded-full text-xs border border-green-700">
                Approved
            </span>
        ) : (
            <span key="status-pending" className="bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded-full text-xs border border-yellow-700">
                Pending
            </span>
        );
    };

    if (loading && activeTab === 'admins') {
        return (
            <div className="p-6 flex justify-center items-center min-h-screen">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Admin Management</h1>
                    <p className="text-gray-400">Manage administrators and view their design activity</p>
                </div>
                <Link href="/dashboards/super-admin-dashboard/admin-management/create-admin">
                    <Button variant="primary" size="md">
                        + Create New Admin
                    </Button>
                </Link>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-800 mb-6">
                <nav className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('admins')}
                        className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                            activeTab === 'admins'
                                ? 'border-red-500 text-white'
                                : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Admin Users
                    </button>
                    <button
                        onClick={() => setActiveTab('designs')}
                        className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                            activeTab === 'designs'
                                ? 'border-red-500 text-white'
                                : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Designs by Admins
                        {designStats.total > 0 && (
                            <span key="design-count-badge" className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                                {designStats.total}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            {/* Error Display */}
            {error && activeTab === 'admins' && (
                <div key="admin-error" className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                    Error: {error}
                </div>
            )}
            
            {designsError && activeTab === 'designs' && (
                <div key="design-error" className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                    Error: {designsError}
                </div>
            )}

            {/* ADMINS TAB */}
            {activeTab === 'admins' && (
                <div key="admins-tab" className="bg-slate-900 rounded-lg border border-gray-800 overflow-hidden">
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
                                <tr key="no-admins-row">
                                    <td colSpan="6" className="text-center p-8 text-gray-400">
                                        No admins found. Click "Create New Admin" to add one.
                                    </td>
                                </tr>
                            ) : (
                                admins.map((admin) => (
                                    <tr key={admin.user} className="border-b border-gray-800 hover:bg-slate-800/50">
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
                                            {admin.role !== 'SuperAdmin' ? (
                                                admin.isActive ? (
                                                    <button 
                                                        key={`deactivate-${admin.user}`}
                                                        onClick={() => handleDeactivate(admin.email)}
                                                        className="text-red-500 hover:text-red-400 text-sm font-medium"
                                                    >
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    <button 
                                                        key={`reactivate-${admin.user}`}
                                                        onClick={() => handleReactivate(admin.email)}
                                                        className="text-green-500 hover:text-green-400 text-sm font-medium"
                                                    >
                                                        Reactivate
                                                    </button>
                                                )
                                            ) : (
                                                <span key={`protected-${admin.user}`} className="text-gray-500 text-sm">Protected</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* DESIGNS TAB */}
            {activeTab === 'designs' && (
                <div key="designs-tab" className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div key="total-designs" className="bg-slate-900 rounded-lg border border-gray-800 p-4">
                            <p className="text-gray-400 text-sm">Total Designs</p>
                            <p className="text-3xl font-bold text-white">{designStats.total}</p>
                        </div>
                        <div key="approved-designs" className="bg-slate-900 rounded-lg border border-gray-800 p-4">
                            <p className="text-gray-400 text-sm">Approved</p>
                            <p className="text-3xl font-bold text-green-400">{designStats.approved}</p>
                        </div>
                        <div key="pending-designs" className="bg-slate-900 rounded-lg border border-gray-800 p-4">
                            <p className="text-gray-400 text-sm">Pending</p>
                            <p className="text-3xl font-bold text-yellow-400">{designStats.pending}</p>
                        </div>
                        <div key="approval-rate" className="bg-slate-900 rounded-lg border border-gray-800 p-4">
                            <p className="text-gray-400 text-sm">Approval Rate</p>
                            <p className="text-3xl font-bold text-blue-400">
                                {designStats.total > 0 
                                    ? Math.round((designStats.approved / designStats.total) * 100) 
                                    : 0}%
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div key="filters-section" className="bg-slate-900 rounded-lg border border-gray-800 p-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <select
                                name="adminId"
                                value={filters.adminId}
                                onChange={handleFilterChange}
                                className="bg-slate-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                            >
                                <option value="">All Admins</option>
                                {admins.map(admin => (
                                    <option key={admin.user} value={admin.user}>
                                        {formatName(admin)} ({admin.email})
                                    </option>
                                ))}
                            </select>

                            <select
                                name="isApproved"
                                value={filters.isApproved}
                                onChange={handleFilterChange}
                                className="bg-slate-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                            >
                                <option value="">All Status</option>
                                <option value="true">Approved</option>
                                <option value="false">Pending</option>
                            </select>

                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                placeholder="Start Date"
                                className="bg-slate-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                            />

                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                placeholder="End Date"
                                className="bg-slate-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                            />

                            <Button key="clear-filters" variant="ghost" size="sm" onClick={clearFilters}>
                                Clear Filters
                            </Button>

                            <Button key="apply-filters" variant="primary" size="sm" onClick={fetchDesigns}>
                                Apply Filters
                            </Button>
                        </div>
                    </div>

                    {/* Designs Table */}
                    <div key="designs-table" className="bg-slate-900 rounded-lg border border-gray-800 overflow-hidden">
                        {designsLoading ? (
                            <div key="loading-state" className="p-8 text-center text-gray-400">Loading designs...</div>
                        ) : designs.length === 0 ? (
                            <div key="empty-state" className="p-8 text-center text-gray-400">No designs found</div>
                        ) : (
                            <>
                                <table className="w-full">
                                    <thead className="bg-slate-950 border-b border-gray-800">
                                        <tr>
                                            <th className="text-left p-4 text-gray-400 font-medium">Design ID</th>
                                            <th className="text-left p-4 text-gray-400 font-medium">Uploaded By</th>
                                            <th className="text-left p-4 text-gray-400 font-medium">Order</th>
                                            <th className="text-left p-4 text-gray-400 font-medium">Product</th>
                                            {/* <th className="text-left p-4 text-gray-400 font-medium">Version</th> */}
                                            <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                                            <th className="text-left p-4 text-gray-400 font-medium">Uploaded</th>
                                            <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {designs.map((design) => (
                                            <tr key={design._id} className="border-b border-gray-800 hover:bg-slate-800/50">
                                                <td className="p-4">
                                                    <span className="text-white font-mono text-sm">
                                                        {design._id.slice(-8)}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-white text-sm">
                                                        {design.uploadedBy?.email?.split('@')[0] || 'Unknown'}
                                                    </div>
                                                    <div className="text-gray-500 text-xs">
                                                        {design.uploadedBy?.role || 'Admin'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Link href={`/dashboards/super-admin-dashboard/orders/${design.orderId?._id || design.orderId}`}>
                                                        <span className="text-blue-400 hover:text-blue-300 text-sm">
                                                            {design.orderId?.orderNumber || 'N/A'}
                                                        </span>
                                                    </Link>
                                                </td>
                                                <td className="p-4 text-gray-300 text-sm">
                                                    {design.productId?.name || 'Unknown Product'}
                                                </td>
                                                {/* <td className="p-4 text-gray-300 text-sm">
                                                    v{design.version || 1}
                                                </td> */}
                                                <td className="p-4">
                                                    {getStatusBadge(design.isApproved)}
                                                </td>
                                                <td className="p-4 text-gray-400 text-xs">
                                                    {formatDate(design.createdAt)}
                                                </td>
                                                <td className="p-4">
                                                    <div key={`actions-${design._id}`} className="flex gap-2">
                                                        <Link href={`/dashboards/super-admin-dashboard/designs/${design._id}`}>
                                                            <button className="text-blue-500 hover:text-blue-400 text-sm">
                                                                View
                                                            </button>
                                                        </Link>
                                                        {design.designUrl && (
                                                            <a 
                                                                key={`download-${design._id}`}
                                                                href={design.designUrl} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-green-500 hover:text-green-400 text-sm"
                                                            >
                                                                Download
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div key="pagination" className="flex justify-center items-center gap-2 p-4 border-t border-gray-800">
                                        <button
                                            key="prev-page"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className={`px-3 py-1 rounded ${
                                                currentPage === 1
                                                    ? 'text-gray-600 cursor-not-allowed'
                                                    : 'text-white hover:bg-slate-800'
                                            }`}
                                        >
                                            Previous
                                        </button>
                                        <span key="page-info" className="text-gray-400">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            key="next-page"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className={`px-3 py-1 rounded ${
                                                currentPage === totalPages
                                                    ? 'text-gray-600 cursor-not-allowed'
                                                    : 'text-white hover:bg-slate-800'
                                            }`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Admin Performance Summary */}
                    {Object.keys(designStats.byAdmin).length > 0 && (
                        <div key="admin-performance" className="bg-slate-900 rounded-lg border border-gray-800 p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Admin Performance</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(designStats.byAdmin).map(([adminId, stats]) => (
                                    <div key={adminId} className="bg-slate-800 rounded-lg p-4">
                                        <h3 className="text-white font-medium mb-2">{stats.name}</h3>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Total Designs:</span>
                                                <span className="text-white">{stats.count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Approved:</span>
                                                <span className="text-green-400">{stats.approved}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Pending:</span>
                                                <span className="text-yellow-400">{stats.count - stats.approved}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Approval Rate:</span>
                                                <span className="text-blue-400">
                                                    {stats.count > 0 
                                                        ? Math.round((stats.approved / stats.count) * 100) 
                                                        : 0}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminManagementPage;