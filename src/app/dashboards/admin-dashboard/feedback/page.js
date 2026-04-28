'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { feedbackService } from '@/services/feedbackService';
import { useAuthCheck } from '@/app/lib/auth';
import { METADATA } from '@/lib/metadata';
import { getImageUrl } from '@/lib/imageUtils';

export default function AdminFeedbackPage() {
  const router = useRouter();
  useAuthCheck();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [response, setResponse] = useState('');
  const [responseFiles, setResponseFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchFeedback();
  }, [filter]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError('');
      let response;
      if (filter === 'all') {
        response = await feedbackService.getAll({ limit: 50 });
      } else {
        response = await feedbackService.filter({
          limit: 50,
          status: filter,
        });
      }
      console.log('📋 Feedback response:', response);
      const feedbackData = response?.feedback || response?.data || [];
      setFeedbacks(feedbackData);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
      setError('Failed to load feedback. Please try again.');
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
      await feedbackService.respond(selectedFeedback._id, formData);
      setShowRespondModal(false);
      setSelectedFeedback(null);
      setResponse('');
      setResponseFiles([]);
      await fetchFeedback();
    } catch (err) {
      console.error('Failed to respond to feedback:', err);
      alert('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (feedbackId, newStatus) => {
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

  const handleUploadNewDesign = (feedback) => {
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

  //   const getImageUrl = (path) => {
  //     if (!path) return null;
  //     if (path.startsWith('http')) return path;
  //     let filename = path.split('/').pop();
  //     return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  //   };

  const getProductName = (feedback) => {
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
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-white">Loading feedback...</div>
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
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Customer Feedback</h1>
              <p className="text-sm text-gray-400 sm:text-base">
                Review, respond, and manage customer feedback
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={fetchFeedback} size="sm" disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              All Feedback
            </button>
            <button
              onClick={() => setFilter('Pending')}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                filter === 'Pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('Reviewed')}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                filter === 'Reviewed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              Reviewed
            </button>
            <button
              onClick={() => setFilter('Resolved')}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                filter === 'Resolved'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              Resolved
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-red-200">
              {error}
            </div>
          )}

          {feedbacks.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-slate-900/30 py-16 text-center">
              <div className="mb-4 text-6xl">💬</div>
              <h3 className="mb-2 text-xl font-semibold text-white">No feedback found</h3>
              <p className="text-gray-400">
                {filter === 'all'
                  ? 'No feedback available'
                  : `No ${filter.toLowerCase()} feedback at the moment`}
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 text-sm text-primary hover:text-primary-dark"
                >
                  View all feedback →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback._id}
                  className="overflow-hidden rounded-xl border border-gray-800 bg-slate-900/50 backdrop-blur-sm"
                >
                  <div className="p-5 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-semibold text-white sm:text-lg">
                            Order #{feedback.orderId?.orderNumber}
                          </h3>
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-medium sm:px-3 bg-${getStatusColor(feedback.status)}-900/50 text-${getStatusColor(feedback.status)}-400`}
                          >
                            {feedback.status}
                          </span>
                          {feedback.designId && (
                            <span className="rounded-full bg-purple-900/50 px-2 py-1 text-xs text-purple-400">
                              Design Feedback
                            </span>
                          )}
                        </div>

                        <div className="mb-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 sm:text-sm">
                          <p className="text-gray-400">
                            <span className="text-gray-500">From:</span>{' '}
                            {feedback.userId?.fullname || feedback.userId?.email || 'Customer'}
                          </p>
                          {feedback.designId && (
                            <p className="text-gray-400">
                              <span className="text-gray-500">Product:</span>{' '}
                              {getProductName(feedback)}
                            </p>
                          )}
                          <p className="text-gray-400">
                            <span className="text-gray-500">Date:</span>{' '}
                            {new Date(feedback.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 rounded-lg bg-slate-800/50 p-4">
                      <p className="mb-2 text-xs text-gray-400 sm:text-sm">Customer Message:</p>
                      <p className="whitespace-pre-wrap text-sm text-white">{feedback.message}</p>

                      {feedback.attachment && feedback.attachment.length > 0 && (
                        <div className="mt-3 border-t border-gray-700 pt-3">
                          <p className="mb-2 text-xs text-gray-400">Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {feedback.attachment.map((url, idx) => (
                              <a
                                key={idx}
                                href={getImageUrl(url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 rounded-lg bg-slate-700 p-2 transition hover:bg-slate-600"
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
                      <div className="mb-4 rounded-lg border border-blue-800 bg-blue-900/20 p-4">
                        <p className="mb-2 text-xs text-blue-400 sm:text-sm">Admin Response:</p>
                        <p className="whitespace-pre-wrap text-sm text-white">
                          {feedback.adminResponse}
                        </p>
                        {feedback.adminResponseAt && (
                          <p className="mt-2 text-xs text-gray-500">
                            Responded on {new Date(feedback.adminResponseAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3 border-t border-gray-800 pt-4">
                      {feedback.status !== 'Resolved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedFeedback(feedback);
                            setShowRespondModal(true);
                          }}
                        >
                          Reply with Message
                        </Button>
                      )}

                      {feedback.status === 'Pending' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateStatus(feedback._id, 'Reviewed')}
                        >
                          Mark Reviewed
                        </Button>
                      )}

                      {feedback.status === 'Reviewed' && feedback.designId && (
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleUploadNewDesign(feedback)}
                        >
                          Upload New Design
                        </Button>
                      )}

                      {feedback.status === 'Reviewed' && !feedback.designId && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateStatus(feedback._id, 'Resolved')}
                        >
                          Mark Resolved
                        </Button>
                      )}

                      <Link href={`/dashboards/admin-dashboard/feedback/${feedback._id}`}>
                        <Button variant="ghost" size="sm">
                          View Full Conversation
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showRespondModal && selectedFeedback && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-800 bg-slate-900">
                <div className="border-b border-gray-800 p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-white sm:text-xl">Reply to Customer</h3>
                  <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                    Order #{selectedFeedback.orderId?.orderNumber}
                  </p>
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  <div className="max-h-40 overflow-y-auto rounded-lg bg-slate-800/50 p-3">
                    <p className="mb-1 text-xs text-gray-400">Customer message:</p>
                    <p className="text-xs text-gray-300 sm:text-sm">{selectedFeedback.message}</p>
                  </div>

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
                        setShowRespondModal(false);
                        setSelectedFeedback(null);
                        setResponse('');
                        setResponseFiles([]);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleRespond}
                      disabled={submitting || !response.trim()}
                      className="flex-1"
                    >
                      {submitting ? 'Sending...' : 'Send Response'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
