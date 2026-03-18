'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
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
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  
  // New state for customer response
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
        limit
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
      // Call API to mark as viewed (you'll need to add this endpoint)
      // await feedbackService.markAsViewed(feedbackId);
      console.log('📌 Marked feedback as viewed:', feedbackId);
      
      // Update local state to reflect viewed status
      setFeedbacks(prev => prev.map(f => 
        f._id === feedbackId ? { ...f, viewedByCustomer: true } : f
      ));
      
      if (selectedFeedback && selectedFeedback._id === feedbackId) {
        setSelectedFeedback(prev => ({ ...prev, viewedByCustomer: true }));
      }
    } catch (err) {
      console.error('Failed to mark feedback as viewed:', err);
    }
  };

  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setShowFeedbackModal(true);
    
    // Mark as viewed when customer opens it
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
    setResponseFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setResponseFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitResponse = async () => {
    if (!responseMessage.trim()) {
      showToast('Please enter your response', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create a new feedback response (this creates a new feedback thread or reply)
      const formData = new FormData();
      formData.append('orderId', selectedFeedback.orderId._id);
      if (selectedFeedback.designId) {
        formData.append('designId', selectedFeedback.designId._id);
      }
      formData.append('message', responseMessage);
      formData.append('parentFeedbackId', selectedFeedback._id); // Link to original feedback
      
      responseFiles.forEach(file => {
        formData.append('attachments', file);
      });
      
      await feedbackService.create(formData);
      
      showToast('Your response has been sent to admin', 'success');
      
      setShowResponseModal(false);
      setResponseMessage('');
      setResponseFiles([]);
      
      // Refresh feedback list
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

  const hasUnreadAdminResponse = (feedback) => {
    return feedback.adminResponse && !feedback.viewedByCustomer;
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
                className={`bg-slate-900/50 border rounded-lg p-5 hover:border-gray-700 transition cursor-pointer group ${
                  hasUnreadAdminResponse(feedback) 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-gray-800'
                }`}
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          hasUnreadAdminResponse(feedback)
                            ? 'bg-green-600/30 text-green-400 border border-green-700'
                            : 'bg-green-900/30 text-green-400'
                        }`}>
                          <span>✓</span> 
                          Admin Responded
                          {hasUnreadAdminResponse(feedback) && (
                            <span className="w-2 h-2 bg-green-400 rounded-full ml-1 animate-pulse"></span>
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

              <div className="p-6 border-t border-gray-800 flex gap-3">
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

        {/* Customer Response Modal */}
        {showResponseModal && selectedFeedback && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-gray-800 max-w-lg w-full">
              <div className="p-6 border-b border-gray-800">
                <h3 className="text-xl font-bold text-white">Reply to Admin</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Order #{selectedFeedback.orderId?.orderNumber}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Original Admin Response Preview */}
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
                  <p className="text-xs text-green-400 mb-1">Admin said:</p>
                  <p className="text-sm text-white">{selectedFeedback.adminResponse}</p>
                </div>

                {/* Response Message */}
                <Textarea
                  placeholder="Type your response..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />

                {/* File Upload Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Attachments (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="response-attachments"
                    />
                    <label htmlFor="response-attachments" className="cursor-pointer">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </label>
                  </div>
                </div>

                {/* Selected Files List */}
                {responseFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Selected Files:</p>
                    {responseFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-800 rounded-lg p-2">
                        <span className="text-white text-sm truncate max-w-[250px]">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
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
      </div>
    </DashboardLayout>
  );
}