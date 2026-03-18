'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { designService } from '@/services/designService';
import { orderService } from '@/services/orderService';
import { useAuthCheck } from '@/app/lib/auth';

export default function SuperAdminDesignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const designId = params.id;
  
  useAuthCheck();

  const [design, setDesign] = useState(null);
  const [allVersions, setAllVersions] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    if (designId) {
      fetchDesignDetails();
    }
  }, [designId]);

  const fetchDesignDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch current design details
      const designResponse = await designService.getById(designId);
      const designData = designResponse?.data || designResponse;
      
      if (!designData) {
        throw new Error('Design not found');
      }
      
      setDesign(designData);
      setSelectedVersion(designData);
      
      // Fetch all designs for this order to get version history
      if (designData.orderId) {
        const orderId = typeof designData.orderId === 'object' 
          ? designData.orderId._id 
          : designData.orderId;
        
        // Fetch all designs for this order
        const versionsResponse = await designService.getByOrder(orderId);
        const versions = versionsResponse?.data || [];
        
        // Sort by version number (descending)
        const sortedVersions = versions.sort((a, b) => (b.version || 1) - (a.version || 1));
        setAllVersions(sortedVersions);
        
        // Fetch order details
        const orderResponse = await orderService.getById(orderId);
        const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
        setOrder(orderData);
      }
      
    } catch (err) {
      console.error('Failed to fetch design:', err);
      setError(err.message || 'Failed to load design details');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDesign = async (versionId) => {
    try {
      await designService.approve(versionId);
      await fetchDesignDetails(); // Refresh
    } catch (err) {
      console.error('Failed to approve design:', err);
      alert('Failed to approve design');
    }
  };

  const handleDeleteDesign = async (versionId) => {
    if (!confirm('Are you sure you want to delete this design version? This action cannot be undone.')) {
      return;
    }
    
    try {
      await designService.delete(versionId);
      
      if (versionId === designId) {
        // If we deleted the current design, go back to versions list
        if (allVersions.length > 1) {
          // Redirect to the next available version
          const nextVersion = allVersions.find(v => v._id !== versionId);
          if (nextVersion) {
            router.push(`/dashboards/super-admin-dashboard/designs/${nextVersion._id}`);
          } else {
            router.push('/dashboards/super-admin-dashboard/designs');
          }
        } else {
          router.push('/dashboards/super-admin-dashboard/designs');
        }
      } else {
        // Just refresh the current view
        await fetchDesignDetails();
      }
    } catch (err) {
      console.error('Failed to delete design:', err);
      alert('Failed to delete design');
    }
  };

  const handleVersionSelect = (version) => {
    setSelectedVersion(version);
    // Update URL without reloading
    window.history.pushState({}, '', `/dashboards/super-admin-dashboard/designs/${version._id}`);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/images/dummy-images/image 3.png';
    if (imagePath.startsWith('http')) return imagePath;
    let filename = imagePath;
    if (imagePath.includes('/')) {
      filename = imagePath.split('/').pop();
    }
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  };

  const downloadAllVersions = () => {
    allVersions.forEach((version, index) => {
      setTimeout(() => {
        if (version.designUrl) {
          const link = document.createElement('a');
          link.href = getImageUrl(version.designUrl);
          link.download = `design-v${version.version || 1}-${version.filename || 'design'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        // Download additional files
        if (version.otherImage && version.otherImage.length > 0) {
          version.otherImage.forEach((url, idx) => {
            const fileLink = document.createElement('a');
            fileLink.href = getImageUrl(url);
            fileLink.download = `design-v${version.version || 1}-additional-${idx + 1}`;
            document.body.appendChild(fileLink);
            fileLink.click();
            document.body.removeChild(fileLink);
          });
        }
      }, index * 500); // Delay each download by 500ms to avoid browser blocking
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCustomerName = () => {
    if (!design) return 'Customer';
    if (design.userId?.fullname) return design.userId.fullname;
    if (design.userId?.email) return design.userId.email.split('@')[0];
    if (order?.userId?.fullname) return order.userId.fullname;
    if (order?.userId?.email) return order.userId.email.split('@')[0];
    return 'Customer';
  };

  const currentDesign = selectedVersion || design;

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading design details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !design) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-red-400 mb-4">{error || 'Design not found'}</p>
          <button
            onClick={() => router.back()}
            className="text-primary hover:text-primary-dark"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Design Details</h1>
              <p className="text-gray-400">
                {allVersions.length} version{allVersions.length !== 1 ? 's' : ''} • Created {formatDate(design.createdAt)}
              </p>
            </div>
            <div className="flex gap-3">
              {allVersions.length > 1 && (
                <Button
                  variant="secondary"
                  onClick={downloadAllVersions}
                >
                  Download All Versions
                </Button>
              )}
              {!currentDesign?.isApproved && (
                <Button
                  variant="primary"
                  onClick={() => handleApproveDesign(currentDesign._id)}
                >
                  Approve Current Version
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-800 mb-6">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('preview')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                activeTab === 'preview'
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Design Preview
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                activeTab === 'versions'
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Versions ({allVersions.length})
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                activeTab === 'details'
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Details & Info
            </button>
          </nav>
        </div>

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Design Preview */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Design Preview</h2>
                  {currentDesign.version && (
                    <span className="px-3 py-1 bg-purple-900/50 text-purple-400 rounded-full text-sm">
                      Version {currentDesign.version}
                    </span>
                  )}
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-center min-h-[500px]">
                  {currentDesign.designUrl ? (
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(currentDesign.designUrl) ? (
                      <img 
                        src={getImageUrl(currentDesign.designUrl)}
                        alt="Design preview"
                        className="max-w-full max-h-[500px] object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-8xl mb-4 text-gray-600">📄</div>
                        <p className="text-gray-400 mb-4">This design is not an image file</p>
                        <a 
                          href={getImageUrl(currentDesign.designUrl)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark"
                        >
                          Download file to view
                        </a>
                      </div>
                    )
                  ) : (
                    <p className="text-gray-500">No design file available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Status Card */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Version Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Approval Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      currentDesign.isApproved 
                        ? 'bg-green-900/50 text-green-400' 
                        : 'bg-yellow-900/50 text-yellow-400'
                    }`}>
                      {currentDesign.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  {currentDesign.isApproved && currentDesign.approvedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Approved:</span>
                      <span className="text-white text-sm">
                        {formatDate(currentDesign.approvedAt)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Version:</span>
                    <span className="text-white font-medium">v{currentDesign.version || 1}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <a 
                    href={getImageUrl(currentDesign.designUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                  >
                    <span className="text-blue-400 text-xl">📥</span>
                    <span className="text-white text-sm">Download This Version</span>
                  </a>
                  
                  {!currentDesign.isApproved && (
                    <button
                      onClick={() => handleApproveDesign(currentDesign._id)}
                      className="w-full flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                    >
                      <span className="text-green-400 text-xl">✓</span>
                      <span className="text-white text-sm">Approve This Version</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteDesign(currentDesign._id)}
                    className="w-full flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                  >
                    <span className="text-red-400 text-xl">🗑️</span>
                    <span className="text-white text-sm">Delete This Version</span>
                  </button>
                  
                  {order && (
                    <Link href={`/dashboards/super-admin-dashboard/orders/${order._id}`}>
                      <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition cursor-pointer">
                        <span className="text-green-400 text-xl">📦</span>
                        <span className="text-white text-sm">View Order</span>
                      </div>
                    </Link>
                  )}
                  
                  {currentDesign.otherImage && currentDesign.otherImage.length > 0 && (
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <span className="text-gray-400 text-sm block mb-2">Additional Files:</span>
                      <div className="space-y-2">
                        {currentDesign.otherImage.map((url, idx) => (
                          <a
                            key={idx}
                            href={getImageUrl(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-slate-700 rounded hover:bg-slate-600 transition"
                          >
                            <span className="text-purple-400">📎</span>
                            <span className="text-xs text-gray-300">File {idx + 1}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Versions Tab */}
        {activeTab === 'versions' && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Version History</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={downloadAllVersions}
              >
                Download All
              </Button>
            </div>
            
            <div className="space-y-4">
              {allVersions.map((version, index) => (
                <div
                  key={version._id}
                  onClick={() => handleVersionSelect(version)}
                  className={`relative p-4 rounded-lg border-2 transition cursor-pointer ${
                    version._id === currentDesign._id
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-800 bg-slate-800/30 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Version Badge */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      version.isApproved ? 'bg-green-900/30' : 'bg-yellow-900/30'
                    }`}>
                      <span className="text-xl">v{version.version || 1}</span>
                    </div>
                    
                    {/* Version Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-white font-medium">
                            Version {version.version || 1}
                          </h3>
                          {version.isApproved ? (
                            <span className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded-full text-xs">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-400 rounded-full text-xs">
                              Pending
                            </span>
                          )}
                          {version._id === design._id && (
                            <span className="px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded-full text-xs">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(version.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-3">
                        Uploaded by {version.uploadedBy?.email || 'Admin'}
                      </p>
                      
                      <div className="flex items-center gap-3">
                        {version.designUrl && (
                          <a
                            href={getImageUrl(version.designUrl)}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            📥 Download
                          </a>
                        )}
                        
                        {!version.isApproved && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveDesign(version._id);
                            }}
                            className="text-xs text-green-400 hover:text-green-300"
                          >
                            ✓ Approve
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDesign(version._id);
                          }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview thumbnail */}
                  {version.designUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(version.designUrl) && (
                    <div className="mt-3 border-t border-gray-800 pt-3">
                      <img
                        src={getImageUrl(version.designUrl)}
                        alt={`Version ${version.version || 1} preview`}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Design Information */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Design Information</h2>
              
              <dl className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <dt className="text-gray-400">Product:</dt>
                  <dd className="text-white">
                    {currentDesign.productId?.name || 'Unknown Product'}
                  </dd>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <dt className="text-gray-400">Customer:</dt>
                  <dd className="text-white">{getCustomerName()}</dd>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <dt className="text-gray-400">Uploaded By:</dt>
                  <dd className="text-white">
                    {currentDesign.uploadedBy?.email || 'Admin'}
                  </dd>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <dt className="text-gray-400">Upload Date:</dt>
                  <dd className="text-white">{formatDate(currentDesign.createdAt)}</dd>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <dt className="text-gray-400">Last Updated:</dt>
                  <dd className="text-white">{formatDate(currentDesign.updatedAt)}</dd>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <dt className="text-gray-400">Version:</dt>
                  <dd className="text-white font-medium">v{currentDesign.version || 1}</dd>
                </div>
                
                <div className="flex justify-between py-2">
                  <dt className="text-gray-400">File Name:</dt>
                  <dd className="text-white font-mono text-sm">{currentDesign.filename || 'N/A'}</dd>
                </div>
              </dl>
            </div>

            {/* Order Information */}
            {order && (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Order Information</h2>
                
                <dl className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <dt className="text-gray-400">Order Number:</dt>
                    <dd className="text-white font-medium">{order.orderNumber}</dd>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <dt className="text-gray-400">Order Status:</dt>
                    <dd className="text-white">
                      <StatusBadge status={order.status} />
                    </dd>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <dt className="text-gray-400">Payment Status:</dt>
                    <dd className="text-white">
                      <StatusBadge status={order.paymentStatus} />
                    </dd>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <dt className="text-gray-400">Total Amount:</dt>
                    <dd className="text-white font-medium">
                      ₦{order.totalAmount?.toLocaleString()}
                    </dd>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <dt className="text-gray-400">Amount Paid:</dt>
                    <dd className="text-green-400 font-medium">
                      ₦{order.amountPaid?.toLocaleString()}
                    </dd>
                  </div>
                  
                  <div className="flex justify-between py-2">
                    <dt className="text-gray-400">Items:</dt>
                    <dd className="text-white text-right">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="mb-1">
                          {item.productName} x{item.quantity}
                        </div>
                      ))}
                    </dd>
                  </div>
                </dl>
                
                <div className="mt-6">
                  <Link href={`/dashboards/super-admin-dashboard/orders/${order._id}`}>
                    <Button variant="secondary" className="w-full">
                      View Full Order Details
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}