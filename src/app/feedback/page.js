'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useProtectedRoute } from '@/app/lib/auth';
import { feedbackService } from '@/services/feedbackService';
import { useToast } from '@/components/providers/ToastProvider';

export default function CustomerFeedbackPage() {
  const router = useRouter();
  const { isLoading: authLoading, user } = useProtectedRoute({
    redirectTo: '/auth/sign-in'
  });
  const { showToast } = useToast();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'reviewed', 'resolved'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMyFeedback();
    }
  }, [authLoading, user, filter, page]);

 const fetchMyFeedback = async () => {
  try {
    setLoading(true);
    setError('');
    
    // Build params object
    const params = {
      page,
      limit
    };
    
    // Add status filter if not 'all'
    if (filter !== 'all') {
      params.status = filter;
    }
    
    console.log('📋 Fetching my feedback with params:', params);
    
    const response = await feedbackService.getMyFeedback(params);
    
    console.log('📋 My feedback response:', response);
    
    // Handle different response structures
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
    
    console.log(`✅ Found ${feedbackData.length} feedback items with status: ${filter}`);
    setFeedbacks(feedbackData);
    setTotalPages(Math.ceil(total / limit));
    
  } catch (err) {
    console.error('❌ Failed to fetch feedback:', err);
    setError('Failed to load your feedback. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setShowFeedbackModal(true);
    
    // If feedback has admin response and hasn't been viewed, mark as viewed
    if (feedback.adminResponse && !feedback.viewedByCustomer) {
      // You might want to call an API to mark as viewed
      // markFeedbackAsViewed(feedback._id);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'yellow',
      'Reviewed': 'blue',
      'Resolved': 'green'
    };
    return colors[status] || 'gray';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending': return '⏳';
      case 'Reviewed': return '👀';
      case 'Resolved': return '✅';
      default: return '📝';
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
        minute: '2-digit'
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

  if (authLoading || loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your feedback...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Feedback</h1>
            <p className="text-gray-400">View and track all your feedback submissions</p>
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-800 pb-4">
          <button
            onClick={() => {
              setFilter('all');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'Resolved' 
                ? 'bg-green-600 text-white' 
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Resolved
          </button>
        </div>

        {/* Feedback List */}
        {feedbacks.length === 0 ? (
          <div className="bg-slate-900/30 rounded-xl border border-gray-800 p-16 text-center">
            <div className="text-7xl mb-4 opacity-50">💬</div>
            <h3 className="text-2xl font-semibold text-white mb-2">No feedback found</h3>
            <p className="text-gray-400 text-lg mb-6">
              {filter === 'all' 
                ? "You haven't submitted any feedback yet" 
                : `No ${filter.toLowerCase()} feedback at the moment`}
            </p>
            <Link href="/">
              <Button variant="primary">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback._id}
                onClick={() => handleViewFeedback(feedback)}
                className="bg-slate-900/50 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Status Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-${getStatusColor(feedback.status)}-900/30`}>
                    {getStatusIcon(feedback.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-${getStatusColor(feedback.status)}-900/50 text-${getStatusColor(feedback.status)}-400`}>
                        {feedback.status}
                      </span>
                      {feedback.adminResponse && (
                        <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <span>✓</span> Admin Responded
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        Order #{feedback.orderId?.orderNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(feedback.createdAt)}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-white mb-3 line-clamp-2">
                      {feedback.message}
                    </p>

                    {/* Admin Response Preview */}
                    {feedback.adminResponse && (
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <p className="text-xs text-gray-400 mb-1">Admin Response:</p>
                        <p className="text-sm text-blue-400 line-clamp-2">
                          {feedback.adminResponse}
                        </p>
                        {feedback.adminResponseAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(feedback.adminResponseAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Attachments Indicator */}
                    {feedback.attachment && feedback.attachment.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                        <span>📎</span>
                        <span>{feedback.attachment.length} attachment(s)</span>
                      </div>
                    )}
                  </div>

                  {/* Arrow Icon */}
                  <div className="text-gray-500 group-hover:text-primary transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    page === 1
                      ? 'bg-slate-800 text-gray-500 cursor-not-allowed'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    page === totalPages
                      ? 'bg-slate-800 text-gray-500 cursor-not-allowed'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback Detail Modal */}
        {showFeedbackModal && selectedFeedback && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-800 sticky top-0 bg-slate-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Feedback Details</h2>
                  <button
                    onClick={() => {
                      setShowFeedbackModal(false);
                      setSelectedFeedback(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Status & Order Info */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-${getStatusColor(selectedFeedback.status)}-900/50 text-${getStatusColor(selectedFeedback.status)}-400`}>
                    {selectedFeedback.status}
                  </span>
                  <span className="text-sm text-gray-400">
                    Order #{selectedFeedback.orderId?.orderNumber}
                  </span>
                  <span className="text-sm text-gray-400">
                    {formatDate(selectedFeedback.createdAt)}
                  </span>
                </div>

                {/* Customer Message */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Your Message</h3>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-white whitespace-pre-wrap">{selectedFeedback.message}</p>
                  </div>
                </div>

                {/* Customer Attachments */}
                {selectedFeedback.attachment && selectedFeedback.attachment.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Your Attachments</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeedback.attachment.map((url, idx) => (
                        <a
                          key={idx}
                          href={getImageUrl(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                        >
                          <span className="text-blue-400">📎</span>
                          <span className="text-sm text-gray-300">Attachment {idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Response */}
                {selectedFeedback.adminResponse && (
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-medium text-green-400">Admin Response</h3>
                      {selectedFeedback.adminResponseAt && (
                        <span className="text-xs text-gray-500">
                          {formatDate(selectedFeedback.adminResponseAt)}
                        </span>
                      )}
                    </div>
                    <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                      <p className="text-white whitespace-pre-wrap">{selectedFeedback.adminResponse}</p>
                    </div>
                    
                    {/* Admin Responder Info */}
                    {selectedFeedback.respondedBy && (
                      <p className="text-xs text-gray-500 mt-2">
                        Responded by: {selectedFeedback.respondedBy.fullname || selectedFeedback.respondedBy.email || 'Admin'}
                      </p>
                    )}
                  </div>
                )}

                {/* Design Info */}
                {selectedFeedback.designId && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Related Design</h3>
                    <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-3">
                      <p className="text-sm text-white">
                        Product: {selectedFeedback.designId.productId?.name || 'Unknown Product'}
                      </p>
                      {selectedFeedback.designId.designUrl && (
                        <a 
                          href={getImageUrl(selectedFeedback.designId.designUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs text-purple-400 hover:text-purple-300"
                        >
                          View Design →
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-800 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedFeedback(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}