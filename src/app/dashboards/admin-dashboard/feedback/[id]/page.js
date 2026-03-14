'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { feedbackService } from '@/services/feedbackService';
import { useAuthCheck } from '@/app/lib/auth';

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
      
      await feedbackService.respond(feedbackId, formData);
      
      setResponse('');
      setResponseFiles([]);
      setShowRespondForm(false);
      await fetchFeedback(); // Refresh to show new response
      
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
      <DashboardLayout userRole="admin">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-white">Loading feedback...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !feedback) {
    return (
      <DashboardLayout userRole="admin">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
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
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Feedback
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Feedback Details</h1>
              <p className="text-gray-400">
                Order #{feedback.orderId?.orderNumber}
              </p>
            </div>
            <StatusBadge status={feedback.status} />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Name</p>
                <p className="text-white">{feedback.userId?.fullname || feedback.userId?.email || 'Customer'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white">{feedback.userId?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Design Info (if applicable) */}
          {feedback.designId && (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Design Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Product</p>
                  <p className="text-white">{getProductName()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Design Version</p>
                  <p className="text-white">v{feedback.designId.version || 1}</p>
                </div>
                {feedback.designId.designUrl && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-400 mb-2">Design Preview</p>
                    <a 
                      href={getImageUrl(feedback.designId.designUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition"
                    >
                      View Design
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Message */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Customer Message</h2>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Submitted on {new Date(feedback.createdAt).toLocaleString()}</p>
              <p className="text-white whitespace-pre-wrap">{feedback.message}</p>
            </div>

            {/* Customer Attachments */}
            {feedback.attachment && feedback.attachment.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Attachments:</p>
                <div className="flex flex-wrap gap-2">
                  {feedback.attachment.map((url, idx) => (
                    <a
                      key={idx}
                      href={getImageUrl(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                    >
                      <span className="text-blue-400">📎</span>
                      <span className="text-xs text-gray-300">Attachment {idx + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin Response (if any) */}
          {feedback.adminResponse && (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Admin Response</h2>
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-400 mb-2">
                  Responded by {feedback.respondedBy?.fullname || 'Admin'} on {new Date(feedback.adminResponseAt).toLocaleString()}
                </p>
                <p className="text-white whitespace-pre-wrap">{feedback.adminResponse}</p>
              </div>
            </div>
          )}

          {/* Respond Form */}
          {showRespondForm ? (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Reply to Customer</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Response <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Type your response message..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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

                <div className="flex gap-3 pt-4">
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
            /* Action Buttons */
            <div className="flex flex-wrap gap-3">
              {feedback.status !== 'Resolved' && (
                <Button
                  variant="primary"
                  onClick={() => setShowRespondForm(true)}
                >
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
                <Button
                  variant="warning"
                  onClick={handleUploadNewDesign}
                >
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

              <Button
                variant="ghost"
                onClick={() => router.back()}
              >
                Go Back
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}