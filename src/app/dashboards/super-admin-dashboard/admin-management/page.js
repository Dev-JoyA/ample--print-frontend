'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SEOHead from '@/components/common/SEOHead';
import { adminService } from '@/services/adminService';
import { designService } from '@/services/designService';
import { useAuthCheck } from '@/app/lib/auth';
import { METADATA } from '@/lib/metadata';

const AdminManagementPage = () => {
  const router = useRouter();
  useAuthCheck();

  const [activeTab, setActiveTab] = useState('admins');

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [designs, setDesigns] = useState([]);
  const [designsLoading, setDesignsLoading] = useState(false);
  const [designsError, setDesignsError] = useState('');
  const [designStats, setDesignStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    byAdmin: {},
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  const [filters, setFilters] = useState({
    adminId: '',
    isApproved: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (activeTab === 'designs') {
      fetchDesigns();
    }
  }, [
    activeTab,
    currentPage,
    filters.adminId,
    filters.isApproved,
    filters.startDate,
    filters.endDate,
  ]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching admins...');
      const data = await adminService.getAllAdmins();
      console.log('✅ Admins data:', data);

      if (Array.isArray(data)) {
        setAdmins(data);
      } else {
        console.error('Data is not an array:', data);
        setAdmins([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch admins:', error);
      setError(error.message || 'Failed to load admins. Please try again.');

      if (error.status === 401) {
        router.push('/auth/sign-in');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDesigns = async () => {
    try {
      setDesignsLoading(true);
      setDesignsError('');

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(filters.adminId && { uploadedBy: filters.adminId }),
        ...(filters.isApproved !== '' && { isApproved: filters.isApproved === 'true' }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };

      console.log('📋 Fetching designs with params:', params);

      const response = await designService.getAll(params);
      console.log('✅ Designs response:', response);

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
      console.error('❌ Failed to fetch designs:', error);
      setDesignsError('Failed to load designs. Please try again.');
      setDesigns([]);
      setDesignStats({ total: 0, approved: 0, pending: 0, byAdmin: {} });
    } finally {
      setDesignsLoading(false);
    }
  };

  const calculateDesignStats = (designsData) => {
    const approved = designsData.filter((d) => d.isApproved).length;
    const pending = designsData.filter((d) => !d.isApproved).length;

    const byAdmin = {};
    designsData.forEach((design) => {
      const adminId = design.uploadedBy?._id || design.uploadedBy;
      const adminName = design.uploadedBy?.email?.split('@')[0] || 'Unknown';

      if (!byAdmin[adminId]) {
        byAdmin[adminId] = {
          name: adminName,
          count: 0,
          approved: 0,
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
      byAdmin,
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      adminId: '',
      isApproved: '',
      startDate: '',
      endDate: '',
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
        alert('Failed to deactivate admin: ' + error.message);
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
      alert('Failed to reactivate admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatName = (admin) => {
    if (admin.firstName) {
      return `${admin.firstName} ${admin.lastName || ''}`.trim();
    }
    return admin.email?.split('@')[0] || 'Unknown';
  };

  const formatUserName = (admin) => {
    if (admin.userName) {
      return admin.userName;
    }
    return admin.email?.split('@')[0] || 'N/A';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (isApproved) => {
    return isApproved ? (
      <span className="inline-block rounded-full border border-green-700 bg-green-900/50 px-2 py-1 text-xs text-green-400">
        Approved
      </span>
    ) : (
      <span className="inline-block rounded-full border border-yellow-700 bg-yellow-900/50 px-2 py-1 text-xs text-yellow-400">
        Pending
      </span>
    );
  };

  if (loading && activeTab === 'admins') {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.superAdmin} title="Admin Management" />
      <DashboardLayout userRole="super-admin">
        <div className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">Admin Management</h1>
                <p className="mt-1 text-sm text-gray-400">
                  Manage administrators and view their design activity
                </p>
              </div>
              <Link href="/dashboards/super-admin-dashboard/admin-management/create-admin">
                <Button variant="primary" size="md">
                  + Create New Admin
                </Button>
              </Link>
            </div>

            <div className="mb-6 border-b border-gray-800">
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab('admins')}
                  className={`border-b-2 px-1 pb-4 text-sm font-medium transition ${
                    activeTab === 'admins'
                      ? 'border-red-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Admin Users
                </button>
                <button
                  onClick={() => setActiveTab('designs')}
                  className={`border-b-2 px-1 pb-4 text-sm font-medium transition ${
                    activeTab === 'designs'
                      ? 'border-red-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Designs by Admins
                  {designStats.total > 0 && (
                    <span className="ml-2 inline-block rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                      {designStats.total}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {error && activeTab === 'admins' && (
              <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
                Error: {error}
              </div>
            )}

            {designsError && activeTab === 'designs' && (
              <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
                Error: {designsError}
              </div>
            )}

            {activeTab === 'admins' && (
              <div className="overflow-x-auto rounded-lg border border-gray-800 bg-slate-900">
                <table className="min-w-full">
                  <thead className="border-b border-gray-800 bg-slate-950">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Name</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Email</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Username</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Role</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Status</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-400">
                          No admins found. Click "Create New Admin" to add one.
                        </td>
                      </tr>
                    ) : (
                      admins.map((admin) => (
                        <tr
                          key={admin.user}
                          className="border-b border-gray-800 hover:bg-slate-800/50"
                        >
                          <td className="p-4 text-white">{formatName(admin)}</td>
                          <td className="p-4 text-gray-300">{admin.email}</td>
                          <td className="p-4 text-gray-300">{formatUserName(admin)}</td>
                          <td className="p-4">
                            <span
                              className={`inline-block rounded-full border px-2 py-1 text-xs ${
                                admin.role === 'SuperAdmin'
                                  ? 'border-purple-700 bg-purple-900/50 text-purple-400'
                                  : 'border-blue-700 bg-blue-900/50 text-blue-400'
                              }`}
                            >
                              {admin.role || 'Admin'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-block rounded-full border px-2 py-1 text-xs ${
                                admin.isActive
                                  ? 'border-green-700 bg-green-900/50 text-green-400'
                                  : 'border-red-700 bg-red-900/50 text-red-400'
                              }`}
                            >
                              {admin.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4">
                            {admin.role !== 'SuperAdmin' ? (
                              admin.isActive ? (
                                <button
                                  onClick={() => handleDeactivate(admin.email)}
                                  className="text-sm font-medium text-red-500 hover:text-red-400"
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivate(admin.email)}
                                  className="text-sm font-medium text-green-500 hover:text-green-400"
                                >
                                  Reactivate
                                </button>
                              )
                            ) : (
                              <span className="text-sm text-gray-500">Protected</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'designs' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
                    <p className="text-sm text-gray-400">Total Designs</p>
                    <p className="text-3xl font-bold text-white">{designStats.total}</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
                    <p className="text-sm text-gray-400">Approved</p>
                    <p className="text-3xl font-bold text-green-400">{designStats.approved}</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
                    <p className="text-sm text-gray-400">Pending</p>
                    <p className="text-3xl font-bold text-yellow-400">{designStats.pending}</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
                    <p className="text-sm text-gray-400">Approval Rate</p>
                    <p className="text-3xl font-bold text-blue-400">
                      {designStats.total > 0
                        ? Math.round((designStats.approved / designStats.total) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-800 bg-slate-900 p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <select
                      name="adminId"
                      value={filters.adminId}
                      onChange={handleFilterChange}
                      className="rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    >
                      <option value="">All Admins</option>
                      {admins.map((admin) => (
                        <option key={admin.user} value={admin.user}>
                          {formatName(admin)} ({admin.email})
                        </option>
                      ))}
                    </select>

                    <select
                      name="isApproved"
                      value={filters.isApproved}
                      onChange={handleFilterChange}
                      className="rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600"
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
                      className="rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />

                    <input
                      type="date"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className="rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />

                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>

                    <Button variant="primary" size="sm" onClick={fetchDesigns}>
                      Apply Filters
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-800 bg-slate-900">
                  {designsLoading ? (
                    <div className="p-8 text-center text-gray-400">Loading designs...</div>
                  ) : designs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No designs found</div>
                  ) : (
                    <>
                      <table className="min-w-full">
                        <thead className="border-b border-gray-800 bg-slate-950">
                          <tr>
                            <th className="p-4 text-left text-sm font-medium text-gray-400">
                              Design ID
                            </th>
                            <th className="p-4 text-left text-sm font-medium text-gray-400">
                              Uploaded By
                            </th>
                            <th className="p-4 text-left text-sm font-medium text-gray-400">
                              Order
                            </th>
                            <th className="p-4 text-left text-sm font-medium text-gray-400">
                              Product
                            </th>
                            <th className="p-4 text-left text-sm font-medium text-gray-400">
                              Status
                            </th>
                            <th className="p-4 text-left text-sm font-medium text-gray-400">
                              Uploaded
                            </th>
                            <th className="p-4 text-left text-sm font-medium text-gray-400">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {designs.map((design) => (
                            <tr
                              key={design._id}
                              className="border-b border-gray-800 hover:bg-slate-800/50"
                            >
                              <td className="p-4">
                                <span className="font-mono text-sm text-white">
                                  {design._id.slice(-8)}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="text-sm text-white">
                                  {design.uploadedBy?.email?.split('@')[0] || 'Unknown'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {design.uploadedBy?.role || 'Admin'}
                                </div>
                              </td>
                              <td className="p-4">
                                <Link
                                  href={`/dashboards/super-admin-dashboard/orders/${design.orderId?._id || design.orderId}`}
                                >
                                  <span className="text-sm text-blue-400 hover:text-blue-300">
                                    {design.orderId?.orderNumber || 'N/A'}
                                  </span>
                                </Link>
                              </td>
                              <td className="p-4 text-sm text-gray-300">
                                {design.productId?.name || 'Unknown Product'}
                              </td>
                              <td className="p-4">{getStatusBadge(design.isApproved)}</td>
                              <td className="p-4 text-xs text-gray-400">
                                {formatDate(design.createdAt)}
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <Link
                                    href={`/dashboards/super-admin-dashboard/designs/${design._id}`}
                                  >
                                    <button className="text-sm text-blue-500 hover:text-blue-400">
                                      View
                                    </button>
                                  </Link>
                                  {design.designUrl && (
                                    <a
                                      href={design.designUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-green-500 hover:text-green-400"
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

                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 border-t border-gray-800 p-4">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`rounded px-3 py-1 ${
                              currentPage === 1
                                ? 'cursor-not-allowed text-gray-600'
                                : 'text-white hover:bg-slate-800'
                            }`}
                          >
                            Previous
                          </button>
                          <span className="text-gray-400">
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`rounded px-3 py-1 ${
                              currentPage === totalPages
                                ? 'cursor-not-allowed text-gray-600'
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

                {Object.keys(designStats.byAdmin).length > 0 && (
                  <div className="rounded-lg border border-gray-800 bg-slate-900 p-6">
                    <h2 className="mb-4 text-xl font-bold text-white">Admin Performance</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(designStats.byAdmin).map(([adminId, stats]) => (
                        <div key={adminId} className="rounded-lg bg-slate-800 p-4">
                          <h3 className="mb-2 font-medium text-white">{stats.name}</h3>
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
                              <span className="text-yellow-400">
                                {stats.count - stats.approved}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Approval Rate:</span>
                              <span className="text-blue-400">
                                {stats.count > 0
                                  ? Math.round((stats.approved / stats.count) * 100)
                                  : 0}
                                %
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
        </div>
      </DashboardLayout>
    </>
  );
};

export default AdminManagementPage;
