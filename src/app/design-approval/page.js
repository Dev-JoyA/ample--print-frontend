'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth, useAuthCheck } from '@/app/lib/auth';
import { designService } from '@/services/designService';
import { feedbackService } from '@/services/feedbackService';

export default function DesignApprovalPage() {
  const router = useRouter();
  const { user } = useAuth();
  useAuthCheck();
  
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [feedbackFiles, setFeedbackFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.userId) {
      fetchDesignsForApproval(user.userId);
    }
  }, [user]);

  const fetchDesignsForApproval = async (userId) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching designs for user:', userId);
      
      // Get all designs for the current user
      const designsResponse = await designService.getByUser(userId);
      console.log('✅ Designs response:', designsResponse);
      
      // Handle different response structures
      const designsData = designsResponse?.data || designsResponse?.designs || [];
      console.log('📦 Designs data:', designsData);
      
      // For each design, check if there's already feedback
      const designsWithFeedbackStatus = await Promise.all(
        designsData.map(async (design) => {
          try {
            // Skip if already approved
            if (design.isApproved) {
              return { ...design, showInApproval: false };
            }
            
            // Check if there's feedback for this design
            const orderId = design.orderId?._id || design.orderId;
            const feedbackResponse = await feedbackService.getByOrder(orderId);
            const feedbacks = feedbackResponse?.data || [];
            
            // Check if any feedback exists for this specific design
            const hasFeedback = feedbacks.some(f => 
              (f.designId?._id === design._id || f.designId === design._id)
            );
            
            console.log(`Design ${design._id} has feedback:`, hasFeedback);
            
            // Show in approval only if not approved AND no feedback yet
            return {
              ...design,
              showInApproval: !design.isApproved && !hasFeedback
            };
            
          } catch (err) {
            console.error(`Error checking feedback for design ${design._id}:`, err);
            // If error checking feedback, still show the design
            return {
              ...design,
              showInApproval: !design.isApproved
            };
          }
        })
      );
      
      // Filter to only show designs that need approval
      const pendingDesigns = designsWithFeedbackStatus.filter(d => d.showInApproval);
      console.log('⏳ Pending designs:', pendingDesigns);
      
      setDesigns(pendingDesigns);
    } catch (err) {
      console.error('❌ Failed to fetch designs:', err);
      setError('Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (designId) => {
    try {
      setSubmitting(true);
      console.log('✅ Approving design:', designId);
      
      await designService.approve(designId);
      
      // Refresh designs
      if (user?.userId) {
        await fetchDesignsForApproval(user.userId);
      }
      
      alert('Design approved successfully!');
    } catch (err) {
      console.error('❌ Failed to approve design:', err);
      alert('Failed to approve design. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFeedbackFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setFeedbackFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide feedback on what needs to be changed');
      return;
    }

    try {
      setSubmitting(true);
      
      // Get order ID from the selected design
      const orderId = selectedDesign.orderId?._id || selectedDesign.orderId;
      
      console.log('📝 Creating feedback for design:', {
        designId: selectedDesign._id,
        orderId,
        message: rejectReason,
        files: feedbackFiles.length
      });
      
      // Create feedback for the design with file attachments
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('designId', selectedDesign._id);
      formData.append('message', rejectReason);
      
      // Add attachments if any
      feedbackFiles.forEach(file => {
        formData.append('attachments', file);
      });
      
      await feedbackService.create(formData);
      
      // Remove the design from local state immediately
      setDesigns(prev => prev.filter(d => d._id !== selectedDesign._id));
      
      setShowRejectModal(false);
      setSelectedDesign(null);
      setRejectReason('');
      setFeedbackFiles([]);
      
      alert('Feedback sent to admin. They will update the design.');
      
    } catch (err) {
      console.error('❌ Failed to reject design:', err);
      alert('Failed to send feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-white">Loading designs...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Design Approval</h1>
          <p className="text-gray-400">Review and approve your designs</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {designs.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-white mb-2">No designs pending approval</h3>
            <p className="text-gray-400">You don't have any designs waiting for your review</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {designs.map((design) => (
              <div key={design._id} className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Design for</p>
                      <h3 className="text-xl font-bold text-white">{design.productId?.name || 'Product'}</h3>
                      <p className="text-xs text-gray-500 mt-1">Order #{design.orderId?.orderNumber}</p>
                    </div>
                    <StatusBadge status="Pending" />
                  </div>

                  {/* Design Preview */}
                  <div className="mb-4 bg-slate-800 rounded-lg p-2">
                    {design.designUrl ? (
                      <img 
                        src={getImageUrl(design.designUrl)} 
                        alt="Design preview"
                        className="w-full h-48 object-contain rounded"
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center text-gray-500">
                        No preview available
                      </div>
                    )}
                  </div>

                  {/* Version Info */}
                  <p className="text-sm text-gray-400 mb-4">
                    Version {design.version} • Uploaded {new Date(design.createdAt).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={() => handleApprove(design._id)}
                      disabled={submitting}
                      className="flex-1"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setSelectedDesign(design);
                        setShowRejectModal(true);
                      }}
                      disabled={submitting}
                      className="flex-1"
                    >
                      Request Changes
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject/Feedback Modal with File Upload */}
        {showRejectModal && selectedDesign && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-gray-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-800">
                <h3 className="text-xl font-bold text-white">Request Design Changes</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-400">
                  Please provide feedback on what changes are needed for the design. You can also upload reference images.
                </p>

                {/* Feedback Message */}
                <Textarea
                  placeholder="Describe what needs to be changed..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />

                {/* File Upload Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Reference Images (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="feedback-attachments"
                    />
                    <label htmlFor="feedback-attachments" className="cursor-pointer">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB (max 5 files)</p>
                    </label>
                  </div>
                </div>

                {/* Selected Files List */}
                {feedbackFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Selected Files:</p>
                    {feedbackFiles.map((file, index) => (
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
                      setShowRejectModal(false);
                      setSelectedDesign(null);
                      setRejectReason('');
                      setFeedbackFiles([]);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleReject}
                    disabled={submitting || !rejectReason.trim()}
                    className="flex-1"
                  >
                    {submitting ? 'Sending...' : 'Send Feedback'}
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