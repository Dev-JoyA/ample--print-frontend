'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { useProtectedRoute } from '@/app/lib/auth';
import { feedbackService } from '@/services/feedbackService';
import { useToast } from '@/components/providers/ToastProvider';
import { METADATA } from '@/lib/metadata';

export default function CustomerFeedbackPage() {
  const router = useRouter();
  const { isLoading: authLoading, user } = useProtectedRoute({
    redirectTo: '/auth/sign-in',
  });
  const { showToast } = useToast();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [responseFiles, setResponseFiles] = useState([]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMyFeedback();
    }
  }, [authLoading, user, filter, page]);

  const fetchMyFeedback = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit,
      };

      if (filter !== 'all') {
        params.status = filter;
      }

      console.log('📋 Fetching my feedback with params:', params);

      const response = await feedbackService.getMyFeedback(params);

      let feedbackData = [];
      let total = 0;

      if (response?.feedback && Array.isArray(response.feedback)) {
        feedbackData = response.feedback;
        total = response.total || feedbackData.length;
      } else if (response?.data && Array.isArray(response.data)) {
        feedbackData = response.data;
        total = response.total || feedbackData.length;
      } else if (Array.isArray(response)) {
        feedbackData = response;
        total = feedbackData.length;
      }

      setFeedbacks(feedbackData);
      setTotalPages(Math.ceil(total / limit));
    } catch (err) {
      console.error('❌ Failed to fetch feedback:', err);
      setError('Failed to load your feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markFeedbackAsViewed = async (feedbackId) => {
    try {
      console.log('📌 Marked feedback as viewed:', feedbackId);

      setFeedbacks((prev) =>
        prev.map((f) => (f._id === feedbackId ? { ...f, viewedByCustomer: true } : f))
      );

      if (selectedFeedback && selectedFeedback._id === feedbackId) {
        setSelectedFeedback((prev) => ({ ...prev, viewedByCustomer: true }));
      }
    } catch (err) {
      console.error('Failed to mark feedback as viewed:', err);
    }
  };

  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setShowFeedbackModal(true);

    if (feedback.adminResponse && !feedback.viewedByCustomer) {
      markFeedbackAsViewed(feedback._id);
    }
  };

  const handleRespondToAdmin = (feedback) => {
    setSelectedFeedback(feedback);
    setShowFeedbackModal(false);
    setShowResponseModal(true);
    setResponseMessage('');
    setResponseFiles([]);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setResponseFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setResponseFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitResponse = async () => {
    if (!responseMessage.trim()) {
      showToast('Please enter your response', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('orderId', selectedFeedback.orderId._id);
      if (selectedFeedback.designId) {
        formData.append('designId', selectedFeedback.designId._id);
      }
      formData.append('message', responseMessage);
      formData.append('parentFeedbackId', selectedFeedback._id);

      responseFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      await feedbackService.create(formData);

      showToast('Your response has been sent to admin', 'success');

      setShowResponseModal(false);
      setResponseMessage('');
      setResponseFiles([]);

      await fetchMyFeedback();
    } catch (err) {
      console.error('Failed to send response:', err);
      showToast('Failed to send response. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'yellow',
      Reviewed: 'blue',
      Resolved: 'green',
    };
    return colors[status] || 'gray';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return '⏳';
      case 'Reviewed':
        return '👀';
      case 'Resolved':
        return '✅';
      default:
        return '📝';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    let filename = path.split('/').pop();
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  };

  const hasUnreadAdminResponse = (feedback) => {
    return feedback.adminResponse && !feedback.viewedByCustomer;
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-gray-400">Loading your feedback...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.feedback} />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">My Feedback</h1>
              <p className="text-sm text-gray-400">View and track all your feedback submissions</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setPage(1);
                  fetchMyFeedback();
                }}
                size="sm"
                className="flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </Button>
              <Link href="/">
                <Button variant="primary" size="sm">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-800 pb-4">
            <button
              onClick={() => {
                setFilter('all');
                setPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              All Feedback
            </button>
            <button
              onClick={() => {
                setFilter('Pending');
                setPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === 'Pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                setFilter('Reviewed');
                setPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === 'Reviewed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              Reviewed
            </button>
            <button
              onClick={() => {
                setFilter('Resolved');
                setPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === 'Resolved'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              Resolved
            </button>
          </div>

          {feedbacks.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-slate-900/30 p-16 text-center">
              <div className="mb-4 text-7xl opacity-50">💬</div>
              <h3 className="mb-2 text-2xl font-semibold text-white">No feedback found</h3>
              <p className="mb-6 text-lg text-gray-400">
                {filter === 'all'
                  ? "You haven't submitted any feedback yet"
                  : `No ${filter.toLowerCase()} feedback at the moment`}
              </p>
              <Link href="/">
                <Button variant="primary">Return to Dashboard</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback._id}
                  onClick={() => handleViewFeedback(feedback)}
                  className={`group cursor-pointer rounded-lg border p-5 transition hover:border-gray-700 ${
                    hasUnreadAdminResponse(feedback)
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-gray-800 bg-slate-900/50'
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl bg-${getStatusColor(feedback.status)}-900/30`}
                    >
                      {getStatusIcon(feedback.status)}
                    </div>

                    <div className="flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium bg-${getStatusColor(feedback.status)}-900/50 text-${getStatusColor(feedback.status)}-400`}
                        >
                          {feedback.status}
                        </span>
                        {feedback.adminResponse && (
                          <span
                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                              hasUnreadAdminResponse(feedback)
                                ? 'border border-green-700 bg-green-600/30 text-green-400'
                                : 'bg-green-900/30 text-green-400'
                            }`}
                          >
                            <span>✓</span>
                            Admin Responded
                            {hasUnreadAdminResponse(feedback) && (
                              <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
                            )}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          Order #{feedback.orderId?.orderNumber}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(feedback.createdAt)}
                        </span>
                      </div>

                      <p className="mb-3 line-clamp-2 text-white">{feedback.message}</p>

                      {feedback.adminResponse && (
                        <div className="mt-3 border-t border-gray-800 pt-3">
                          <p className="mb-1 text-xs text-gray-400">Admin Response:</p>
                          <p className="line-clamp-2 text-sm text-blue-400">
                            {feedback.adminResponse}
                          </p>
                          {feedback.adminResponseAt && (
                            <p className="mt-1 text-xs text-gray-500">
                              {formatDate(feedback.adminResponseAt)}
                            </p>
                          )}
                        </div>
                      )}

                      {feedback.attachment && feedback.attachment.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                          <span>📎</span>
                          <span>{feedback.attachment.length} attachment(s)</span>
                        </div>
                      )}
                    </div>

                    <div className="text-gray-500 transition group-hover:text-primary">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      page === 1
                        ? 'cursor-not-allowed bg-slate-800 text-gray-500'
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      page === totalPages
                        ? 'cursor-not-allowed bg-slate-800 text-gray-500'
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>

      {showFeedbackModal && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-800 bg-slate-900">
            <div className="sticky top-0 border-b border-gray-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Feedback Details</h2>
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedFeedback(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium bg-${getStatusColor(selectedFeedback.status)}-900/50 text-${getStatusColor(selectedFeedback.status)}-400`}
                >
                  {selectedFeedback.status}
                </span>
                <span className="text-sm text-gray-400">
                  Order #{selectedFeedback.orderId?.orderNumber}
                </span>
                <span className="text-sm text-gray-400">
                  {formatDate(selectedFeedback.createdAt)}
                </span>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-400">Your Message</h3>
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <p className="whitespace-pre-wrap text-white">{selectedFeedback.message}</p>
                </div>
              </div>

              {selectedFeedback.attachment && selectedFeedback.attachment.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-400">Your Attachments</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeedback.attachment.map((url, idx) => (
                      <a
                        key={idx}
                        href={getImageUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-slate-800 p-3 transition hover:bg-slate-700"
                      >
                        <span className="text-blue-400">📎</span>
                        <span className="text-sm text-gray-300">Attachment {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedFeedback.adminResponse && (
                <div className="mt-6 border-t border-gray-800 pt-6">
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="text-sm font-medium text-green-400">Admin Response</h3>
                    {selectedFeedback.adminResponseAt && (
                      <span className="text-xs text-gray-500">
                        {formatDate(selectedFeedback.adminResponseAt)}
                      </span>
                    )}
                  </div>
                  <div className="rounded-lg border border-green-800 bg-green-900/20 p-4">
                    <p className="whitespace-pre-wrap text-white">
                      {selectedFeedback.adminResponse}
                    </p>
                  </div>

                  {selectedFeedback.respondedBy && (
                    <p className="mt-2 text-xs text-gray-500">
                      Responded by:{' '}
                      {selectedFeedback.respondedBy.fullname ||
                        selectedFeedback.respondedBy.email ||
                        'Admin'}
                    </p>
                  )}
                </div>
              )}

              {selectedFeedback.designId && (
                <div className="mt-4 border-t border-gray-800 pt-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-400">Related Design</h3>
                  <div className="rounded-lg border border-purple-800 bg-purple-900/20 p-3">
                    <p className="text-sm text-white">
                      Product: {selectedFeedback.designId.productId?.name || 'Unknown Product'}
                    </p>
                    {selectedFeedback.designId.designUrl && (
                      <a
                        href={getImageUrl(selectedFeedback.designId.designUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-purple-400 hover:text-purple-300"
                      >
                        View Design →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-gray-800 p-6">
              {selectedFeedback.adminResponse && selectedFeedback.status !== 'Resolved' && (
                <Button
                  variant="primary"
                  onClick={() => handleRespondToAdmin(selectedFeedback)}
                  className="flex-1"
                >
                  Reply to Admin
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedFeedback(null);
                }}
                className={selectedFeedback.adminResponse ? 'flex-1' : 'w-full'}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showResponseModal && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-slate-900">
            <div className="border-b border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white">Reply to Admin</h3>
              <p className="mt-1 text-sm text-gray-400">
                Order #{selectedFeedback.orderId?.orderNumber}
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-lg border border-green-800 bg-green-900/20 p-3">
                <p className="mb-1 text-xs text-green-400">Admin said:</p>
                <p className="text-sm text-white">{selectedFeedback.adminResponse}</p>
              </div>

              <Textarea
                placeholder="Type your response..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white"
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Upload Attachments (Optional)
                </label>
                <div className="rounded-lg border-2 border-dashed border-gray-700 p-4 text-center transition-colors hover:border-primary/50">
                  <input
                    type="file"
                    accept="image/*"
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
                    <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </label>
                </div>
              </div>

              {responseFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-300">Selected Files:</p>
                  {responseFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-slate-800 p-2"
                    >
                      <span className="max-w-[250px] truncate text-sm text-white">{file.name}</span>
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

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowResponseModal(false);
                    setResponseMessage('');
                    setResponseFiles([]);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmitResponse}
                  disabled={submitting || !responseMessage.trim()}
                  className="flex-1"
                >
                  {submitting ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
