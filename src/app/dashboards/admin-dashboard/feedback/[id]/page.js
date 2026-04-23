'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { feedbackService } from '@/services/feedbackService';
import { useAuthCheck } from '@/app/lib/auth';
import { METADATA } from '@/lib/metadata';

export default function FeedbackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const feedbackId = params.id;
  useAuthCheck();

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [response, setResponse] = useState('');
  const [responseFiles, setResponseFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showRespondForm, setShowRespondForm] = useState(false);

  useEffect(() => {
    if (feedbackId) {
      fetchFeedback();
    }
  }, [feedbackId]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await feedbackService.getById(feedbackId);
      console.log('📋 Feedback detail:', response);
      const feedbackData = response?.data || response;
      setFeedback(feedbackData);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setResponseFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setResponseFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRespond = async () => {
    if (!response.trim()) {
      alert('Please enter a response message');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('response', response);
      responseFiles.forEach((file) => {
        formData.append('attachments', file);
      });
      await feedbackService.respond(feedbackId, formData);
      setResponse('');
      setResponseFiles([]);
      setShowRespondForm(false);
      await fetchFeedback();
    } catch (err) {
      console.error('Failed to respond to feedback:', err);
      alert('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setSubmitting(true);
      await feedbackService.updateStatus(feedbackId, newStatus);
      await fetchFeedback();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadNewDesign = () => {
    const productId = feedback.designId?.productId?._id || feedback.designId?.productId;
    router.push(
      `/dashboards/admin-dashboard/design-upload?orderId=${feedback.orderId._id}&productId=${productId}&feedbackId=${feedback._id}`
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'yellow',
      Reviewed: 'blue',
      Resolved: 'green',
    };
    return colors[status] || 'gray';
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    let filename = path.split('/').pop();
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  };

  const getProductName = () => {
    if (!feedback?.designId) return null;
    if (feedback.designId?.productId?.name) {
      return feedback.designId.productId.name;
    }
    if (feedback.designId?.productName) {
      return feedback.designId.productName;
    }
    return 'Unknown Product';
  };

  if (loading) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-white">Loading feedback...</div>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (error || !feedback) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="py-16 text-center">
              <p className="text-red-400">{error || 'Feedback not found'}</p>
              <button
                onClick={() => router.back()}
                className="mt-4 text-primary hover:text-primary-dark"
              >
                Go Back
              </button>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.admin} />
      <DashboardLayout userRole="admin">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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
              <span className="text-sm sm:text-base">Back to Feedback</span>
            </button>

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Feedback Details</h1>
                <p className="text-sm text-gray-400 sm:text-base">
                  Order #{feedback.orderId?.orderNumber}
                </p>
              </div>
              <div className="self-start sm:self-auto">
                <StatusBadge status={feedback.status} />
              </div>
            </div>
          </div>

          <div className="space-y-5 sm:space-y-6">
            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-white sm:text-lg">
                Customer Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-400 sm:text-sm">Name</p>
                  <p className="text-sm text-white sm:text-base">
                    {feedback.userId?.fullname || feedback.userId?.email || 'Customer'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 sm:text-sm">Email</p>
                  <p className="text-sm text-white sm:text-base">
                    {feedback.userId?.email || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {feedback.designId && (
              <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6">
                <h2 className="mb-4 text-base font-semibold text-white sm:text-lg">
                  Design Information
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-400 sm:text-sm">Product</p>
                    <p className="text-sm text-white sm:text-base">{getProductName()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 sm:text-sm">Design Version</p>
                    <p className="text-sm text-white sm:text-base">
                      v{feedback.designId.version || 1}
                    </p>
                  </div>
                  {feedback.designId.designUrl && (
                    <div className="sm:col-span-2">
                      <p className="mb-2 text-xs text-gray-400 sm:text-sm">Design Preview</p>
                      <a
                        href={getImageUrl(feedback.designId.designUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-lg bg-purple-600/20 px-4 py-2 text-sm text-purple-400 transition hover:bg-purple-600/30"
                      >
                        View Design
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-white sm:text-lg">
                Customer Message
              </h2>
              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="mb-2 text-xs text-gray-400">
                  Submitted on {new Date(feedback.createdAt).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap text-sm text-white sm:text-base">
                  {feedback.message}
                </p>
              </div>

              {feedback.attachment && feedback.attachment.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-gray-400 sm:text-sm">Attachments:</p>
                  <div className="flex flex-wrap gap-2">
                    {feedback.attachment.map((url, idx) => (
                      <a
                        key={idx}
                        href={getImageUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-slate-800 p-2 transition hover:bg-slate-700"
                      >
                        <span className="text-blue-400">📎</span>
                        <span className="text-xs text-gray-300">Attachment {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {feedback.adminResponse && (
              <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6">
                <h2 className="mb-4 text-base font-semibold text-white sm:text-lg">
                  Admin Response
                </h2>
                <div className="rounded-lg border border-blue-800 bg-blue-900/20 p-4">
                  <p className="mb-2 text-xs text-blue-400">
                    Responded by {feedback.respondedBy?.fullname || 'Admin'} on{' '}
                    {new Date(feedback.adminResponseAt).toLocaleString()}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-white sm:text-base">
                    {feedback.adminResponse}
                  </p>
                </div>
              </div>
            )}

            {showRespondForm ? (
              <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6">
                <h2 className="mb-4 text-base font-semibold text-white sm:text-lg">
                  Reply to Customer
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Your Response <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Type your response message..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Attachments (Optional)
                    </label>
                    <div className="rounded-lg border-2 border-dashed border-gray-700 p-4 text-center transition-colors hover:border-primary/50">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="response-attachments"
                      />
                      <label htmlFor="response-attachments" className="cursor-pointer">
                        <svg
                          className="mx-auto mb-2 h-8 w-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        <p className="text-sm text-gray-400">Click to upload files</p>
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                      </label>
                    </div>
                  </div>

                  {responseFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-300">Files to attach:</p>
                      {responseFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex flex-col justify-between gap-2 rounded-lg bg-slate-800 p-2 sm:flex-row sm:items-center"
                        >
                          <span className="max-w-full truncate text-sm text-white sm:max-w-[250px]">
                            {file.name}
                          </span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowRespondForm(false);
                        setResponse('');
                        setResponseFiles([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleRespond}
                      disabled={submitting || !response.trim()}
                    >
                      {submitting ? 'Sending...' : 'Send Response'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {feedback.status !== 'Resolved' && (
                  <Button variant="primary" onClick={() => setShowRespondForm(true)}>
                    Reply to Customer
                  </Button>
                )}

                {feedback.status === 'Pending' && (
                  <Button
                    variant="secondary"
                    onClick={() => handleUpdateStatus('Reviewed')}
                    disabled={submitting}
                  >
                    Mark Reviewed
                  </Button>
                )}

                {feedback.status === 'Reviewed' && feedback.designId && (
                  <Button variant="warning" onClick={handleUploadNewDesign}>
                    Upload New Design
                  </Button>
                )}

                {feedback.status === 'Reviewed' && !feedback.designId && (
                  <Button
                    variant="secondary"
                    onClick={() => handleUpdateStatus('Resolved')}
                    disabled={submitting}
                  >
                    Mark Resolved
                  </Button>
                )}

                <Button variant="ghost" onClick={() => router.back()}>
                  Go Back
                </Button>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
