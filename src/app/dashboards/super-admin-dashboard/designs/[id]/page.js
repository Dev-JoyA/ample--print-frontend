'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { designService } from '@/services/designService';
import { orderService } from '@/services/orderService';
import { useAuthCheck } from '@/app/lib/auth';
import { METADATA } from '@/lib/metadata';

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

      const designResponse = await designService.getById(designId);
      const designData = designResponse?.data || designResponse;

      if (!designData) {
        throw new Error('Design not found');
      }

      setDesign(designData);
      setSelectedVersion(designData);

      if (designData.orderId) {
        const orderId =
          typeof designData.orderId === 'object' ? designData.orderId._id : designData.orderId;

        const versionsResponse = await designService.getByOrder(orderId);
        const versions = versionsResponse?.data || [];

        const sortedVersions = versions.sort((a, b) => (b.version || 1) - (a.version || 1));
        setAllVersions(sortedVersions);

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
      await fetchDesignDetails();
    } catch (err) {
      console.error('Failed to approve design:', err);
      alert('Failed to approve design');
    }
  };

  const handleDeleteDesign = async (versionId) => {
    if (
      !confirm('Are you sure you want to delete this design version? This action cannot be undone.')
    ) {
      return;
    }

    try {
      await designService.delete(versionId);

      if (versionId === designId) {
        if (allVersions.length > 1) {
          const nextVersion = allVersions.find((v) => v._id !== versionId);
          if (nextVersion) {
            router.push(`/dashboards/super-admin-dashboard/designs/${nextVersion._id}`);
          } else {
            router.push('/dashboards/super-admin-dashboard/designs');
          }
        } else {
          router.push('/dashboards/super-admin-dashboard/designs');
        }
      } else {
        await fetchDesignDetails();
      }
    } catch (err) {
      console.error('Failed to delete design:', err);
      alert('Failed to delete design');
    }
  };

  const handleVersionSelect = (version) => {
    setSelectedVersion(version);
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
      }, index * 500);
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white">Loading design details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !design) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="mb-4 text-red-400">{error || 'Design not found'}</p>
          <button onClick={() => router.back()} className="text-primary hover:text-primary-dark">
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.superAdmin} title={`Design - ${design._id?.slice(-8)}`} />
      <DashboardLayout userRole="super-admin">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-white">Design Details</h1>
                <p className="text-gray-400">
                  {allVersions.length} version{allVersions.length !== 1 ? 's' : ''} • Created{' '}
                  {formatDate(design.createdAt)}
                </p>
              </div>
              <div className="flex gap-3">
                {allVersions.length > 1 && (
                  <Button variant="secondary" onClick={downloadAllVersions}>
                    Download All Versions
                  </Button>
                )}
                {!currentDesign?.isApproved && (
                  <Button variant="primary" onClick={() => handleApproveDesign(currentDesign._id)}>
                    Approve Current Version
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 border-b border-gray-800">
            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab('preview')}
                className={`border-b-2 px-1 pb-4 text-sm font-medium transition ${
                  activeTab === 'preview'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Design Preview
              </button>
              <button
                onClick={() => setActiveTab('versions')}
                className={`border-b-2 px-1 pb-4 text-sm font-medium transition ${
                  activeTab === 'versions'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Versions ({allVersions.length})
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`border-b-2 px-1 pb-4 text-sm font-medium transition ${
                  activeTab === 'details'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Details & Info
              </button>
            </nav>
          </div>

          {activeTab === 'preview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Design Preview</h2>
                    {currentDesign.version && (
                      <span className="rounded-full bg-purple-900/50 px-3 py-1 text-sm text-purple-400">
                        Version {currentDesign.version}
                      </span>
                    )}
                  </div>

                  <div className="flex min-h-[500px] items-center justify-center rounded-lg bg-slate-800 p-4">
                    {currentDesign.designUrl ? (
                      /\.(jpg|jpeg|png|gif|webp)$/i.test(currentDesign.designUrl) ? (
                        <img
                          src={getImageUrl(currentDesign.designUrl)}
                          alt="Design preview"
                          className="max-h-[500px] max-w-full rounded-lg object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="mb-4 text-8xl text-gray-600">📄</div>
                          <p className="mb-4 text-gray-400">This design is not an image file</p>
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

              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-white">Version Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Approval Status:</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          currentDesign.isApproved
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-yellow-900/50 text-yellow-400'
                        }`}
                      >
                        {currentDesign.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    {currentDesign.isApproved && currentDesign.approvedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Approved:</span>
                        <span className="text-sm text-white">
                          {formatDate(currentDesign.approvedAt)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Version:</span>
                      <span className="font-medium text-white">v{currentDesign.version || 1}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-white">Quick Actions</h3>
                  <div className="space-y-3">
                    <a
                      href={getImageUrl(currentDesign.designUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex cursor-pointer items-center gap-3 rounded-lg bg-slate-800 p-3 transition hover:bg-slate-700"
                    >
                      <span className="text-xl text-blue-400">📥</span>
                      <span className="text-sm text-white">Download This Version</span>
                    </a>

                    {!currentDesign.isApproved && (
                      <button
                        onClick={() => handleApproveDesign(currentDesign._id)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-slate-800 p-3 transition hover:bg-slate-700"
                      >
                        <span className="text-xl text-green-400">✓</span>
                        <span className="text-sm text-white">Approve This Version</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteDesign(currentDesign._id)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-slate-800 p-3 transition hover:bg-slate-700"
                    >
                      <span className="text-xl text-red-400">🗑️</span>
                      <span className="text-sm text-white">Delete This Version</span>
                    </button>

                    {order && (
                      <Link href={`/dashboards/super-admin-dashboard/orders/${order._id}`}>
                        <div className="flex cursor-pointer items-center gap-3 rounded-lg bg-slate-800 p-3 transition hover:bg-slate-700">
                          <span className="text-xl text-green-400">📦</span>
                          <span className="text-sm text-white">View Order</span>
                        </div>
                      </Link>
                    )}

                    {currentDesign.otherImage && currentDesign.otherImage.length > 0 && (
                      <div className="rounded-lg bg-slate-800 p-3">
                        <span className="mb-2 block text-sm text-gray-400">Additional Files:</span>
                        <div className="space-y-2">
                          {currentDesign.otherImage.map((url, idx) => (
                            <a
                              key={idx}
                              href={getImageUrl(url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded bg-slate-700 p-2 transition hover:bg-slate-600"
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

          {activeTab === 'versions' && (
            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Version History</h2>
                <Button variant="secondary" size="sm" onClick={downloadAllVersions}>
                  Download All
                </Button>
              </div>

              <div className="space-y-4">
                {allVersions.map((version) => (
                  <div
                    key={version._id}
                    onClick={() => handleVersionSelect(version)}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition ${
                      version._id === currentDesign._id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-800 bg-slate-800/30 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                          version.isApproved ? 'bg-green-900/30' : 'bg-yellow-900/30'
                        }`}
                      >
                        <span className="text-xl">v{version.version || 1}</span>
                      </div>

                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-medium text-white">
                              Version {version.version || 1}
                            </h3>
                            {version.isApproved ? (
                              <span className="rounded-full bg-green-900/50 px-2 py-0.5 text-xs text-green-400">
                                Approved
                              </span>
                            ) : (
                              <span className="rounded-full bg-yellow-900/50 px-2 py-0.5 text-xs text-yellow-400">
                                Pending
                              </span>
                            )}
                            {version._id === design._id && (
                              <span className="rounded-full bg-blue-900/50 px-2 py-0.5 text-xs text-blue-400">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(version.createdAt)}
                          </span>
                        </div>

                        <p className="mb-3 text-sm text-gray-400">
                          Uploaded by {version.uploadedBy?.email || 'Admin'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          {version.designUrl && (
                            <a
                              href={getImageUrl(version.designUrl)}
                              download
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
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

                    {version.designUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(version.designUrl) && (
                      <div className="mt-3 border-t border-gray-800 pt-3">
                        <img
                          src={getImageUrl(version.designUrl)}
                          alt={`Version ${version.version || 1} preview`}
                          className="h-32 w-32 rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 text-xl font-semibold text-white">Design Information</h2>

                <dl className="space-y-3">
                  <div className="flex justify-between border-b border-gray-800 py-2">
                    <dt className="text-gray-400">Product:</dt>
                    <dd className="text-white">
                      {currentDesign.productId?.name || 'Unknown Product'}
                    </dd>
                  </div>

                  <div className="flex justify-between border-b border-gray-800 py-2">
                    <dt className="text-gray-400">Customer:</dt>
                    <dd className="text-white">{getCustomerName()}</dd>
                  </div>

                  <div className="flex justify-between border-b border-gray-800 py-2">
                    <dt className="text-gray-400">Uploaded By:</dt>
                    <dd className="text-white">{currentDesign.uploadedBy?.email || 'Admin'}</dd>
                  </div>

                  <div className="flex justify-between border-b border-gray-800 py-2">
                    <dt className="text-gray-400">Upload Date:</dt>
                    <dd className="text-white">{formatDate(currentDesign.createdAt)}</dd>
                  </div>

                  <div className="flex justify-between border-b border-gray-800 py-2">
                    <dt className="text-gray-400">Last Updated:</dt>
                    <dd className="text-white">{formatDate(currentDesign.updatedAt)}</dd>
                  </div>

                  <div className="flex justify-between border-b border-gray-800 py-2">
                    <dt className="text-gray-400">Version:</dt>
                    <dd className="font-medium text-white">v{currentDesign.version || 1}</dd>
                  </div>

                  <div className="flex justify-between py-2">
                    <dt className="text-gray-400">File Name:</dt>
                    <dd className="font-mono text-sm text-white">
                      {currentDesign.filename || 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>

              {order && (
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                  <h2 className="mb-4 text-xl font-semibold text-white">Order Information</h2>

                  <dl className="space-y-3">
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <dt className="text-gray-400">Order Number:</dt>
                      <dd className="font-medium text-white">{order.orderNumber}</dd>
                    </div>

                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <dt className="text-gray-400">Order Status:</dt>
                      <dd className="text-white">
                        <StatusBadge status={order.status} />
                      </dd>
                    </div>

                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <dt className="text-gray-400">Payment Status:</dt>
                      <dd className="text-white">
                        <StatusBadge status={order.paymentStatus} />
                      </dd>
                    </div>

                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <dt className="text-gray-400">Total Amount:</dt>
                      <dd className="font-medium text-white">
                        ₦{order.totalAmount?.toLocaleString()}
                      </dd>
                    </div>

                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <dt className="text-gray-400">Amount Paid:</dt>
                      <dd className="font-medium text-green-400">
                        ₦{order.amountPaid?.toLocaleString()}
                      </dd>
                    </div>

                    <div className="flex justify-between py-2">
                      <dt className="text-gray-400">Items:</dt>
                      <dd className="text-right text-white">
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
    </>
  );
}
