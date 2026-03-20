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
          status: filter 
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
    setResponseFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setResponseFiles(prev => prev.filter((_, i) => i !== index));
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
      responseFiles.forEach(file => {
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
    const productId = feedback.designId?.productId?._id || 
                     feedback.designId?.productId;
    router.push(
      `/dashboards/admin-dashboard/design-upload?orderId=${feedback.orderId._id}&productId=${productId}&feedbackId=${feedback._id}`
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'yellow',
      'Reviewed': 'blue',
      'Resolved': 'green'
    };
    return colors[status] || 'gray';
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    let filename = path.split('/').pop();
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  };

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
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-center items-center min-h-[60vh]">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Customer Feedback</h1>
              <p className="text-gray-400 text-sm sm:text-base">Review, respond, and manage customer feedback</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={fetchFeedback}
                size="sm"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                filter === 'all' ? 'bg-primary text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              All Feedback
            </button>
            <button
              onClick={() => setFilter('Pending')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                filter === 'Pending' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('Reviewed')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                filter === 'Reviewed' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              Reviewed
            </button>
            <button
              onClick={() => setFilter('Resolved')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                filter === 'Resolved' ? 'bg-green-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              Resolved
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {feedbacks.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-white mb-2">No feedback found</h3>
              <p className="text-gray-400">
                {filter === 'all' 
                  ? 'No feedback available' 
                  : `No ${filter.toLowerCase()} feedback at the moment`}
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 text-primary hover:text-primary-dark text-sm"
                >
                  View all feedback →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-white">
                            Order #{feedback.orderId?.orderNumber}
                          </h3>
                          <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-${getStatusColor(feedback.status)}-900/50 text-${getStatusColor(feedback.status)}-400`}>
                            {feedback.status}
                          </span>
                          {feedback.designId && (
                            <span className="px-2 py-1 bg-purple-900/50 text-purple-400 rounded-full text-xs">
                              Design Feedback
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
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

                    <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                      <p className="text-xs sm:text-sm text-gray-400 mb-2">Customer Message:</p>
                      <p className="text-white whitespace-pre-wrap text-sm">{feedback.message}</p>
                      
                      {feedback.attachment && feedback.attachment.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <p className="text-xs text-gray-400 mb-2">Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {feedback.attachment.map((url, idx) => (
                              <a
                                key={idx}
                                href={getImageUrl(url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
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
                      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-4">
                        <p className="text-xs sm:text-sm text-blue-400 mb-2">Admin Response:</p>
                        <p className="text-white whitespace-pre-wrap text-sm">{feedback.adminResponse}</p>
                        {feedback.adminResponseAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Responded on {new Date(feedback.adminResponseAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-800">
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
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 rounded-xl border border-gray-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-5 sm:p-6 border-b border-gray-800">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Reply to Customer</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Order #{selectedFeedback.orderId?.orderNumber}
                  </p>
                </div>
                
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="bg-slate-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="text-xs text-gray-400 mb-1">Customer message:</p>
                    <p className="text-xs sm:text-sm text-gray-300">{selectedFeedback.message}</p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Your Response <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Type your response message..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Attachments (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="response-attachments"
                      />
                      <label htmlFor="response-attachments" className="cursor-pointer">
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <p className="text-sm text-gray-400">Click to upload files</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                      </label>
                    </div>
                  </div>

                  {responseFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-300">Files to attach:</p>
                      {responseFiles.map((file, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-800 rounded-lg p-2">
                          <span className="text-white text-sm truncate max-w-full sm:max-w-[250px]">{file.name}</span>
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

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
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