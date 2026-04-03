"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import StatusBadge from "@/components/ui/StatusBadge";
import SEOHead from "@/components/common/SEOHead";
import { useAuth, useAuthCheck } from "@/app/lib/auth";
import { designService } from "@/services/designService";
import { feedbackService } from "@/services/feedbackService";
import { METADATA } from "@/lib/metadata";

export default function DesignApprovalPage() {
  const router = useRouter();
  const { user } = useAuth();
  useAuthCheck();
  
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
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
      console.log("🔍 Fetching designs for user:", userId);
      
      const designsResponse = await designService.getByUser(userId);
      console.log("✅ Designs response:", designsResponse);
      
      const designsData = designsResponse?.data || designsResponse?.designs || [];
      console.log("📦 Designs data:", designsData);
      
      const designsWithFeedbackStatus = await Promise.all(
        designsData.map(async (design) => {
          try {
            if (design.isApproved) {
              return { ...design, showInApproval: false };
            }
            
            const orderId = design.orderId?._id || design.orderId;
            const feedbackResponse = await feedbackService.getByOrder(orderId);
            const feedbacks = feedbackResponse?.data || [];
            
            const hasFeedback = feedbacks.some(f => 
              (f.designId?._id === design._id || f.designId === design._id)
            );
            
            console.log(`Design ${design._id} has feedback:`, hasFeedback);
            
            return {
              ...design,
              showInApproval: !design.isApproved && !hasFeedback
            };
            
          } catch (err) {
            console.error(`Error checking feedback for design ${design._id}:`, err);
            return {
              ...design,
              showInApproval: !design.isApproved
            };
          }
        })
      );
      
      const pendingDesigns = designsWithFeedbackStatus.filter(d => d.showInApproval);
      console.log("⏳ Pending designs:", pendingDesigns);
      
      setDesigns(pendingDesigns);
    } catch (err) {
      console.error("❌ Failed to fetch designs:", err);
      setError("Failed to load designs");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (designId) => {
    try {
      setSubmitting(true);
      console.log("✅ Approving design:", designId);
      
      await designService.approve(designId);
      
      if (user?.userId) {
        await fetchDesignsForApproval(user.userId);
      }
      
      alert("Design approved successfully!");
    } catch (err) {
      console.error("❌ Failed to approve design:", err);
      alert("Failed to approve design. Please try again.");
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
      alert("Please provide feedback on what needs to be changed");
      return;
    }

    try {
      setSubmitting(true);
      
      const orderId = selectedDesign.orderId?._id || selectedDesign.orderId;
      
      console.log("📝 Creating feedback for design:", {
        designId: selectedDesign._id,
        orderId,
        message: rejectReason,
        files: feedbackFiles.length
      });
      
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("designId", selectedDesign._id);
      formData.append("message", rejectReason);
      
      feedbackFiles.forEach(file => {
        formData.append("attachments", file);
      });
      
      await feedbackService.create(formData);
      
      setDesigns(prev => prev.filter(d => d._id !== selectedDesign._id));
      
      setShowRejectModal(false);
      setSelectedDesign(null);
      setRejectReason("");
      setFeedbackFiles([]);
      
      alert("Feedback sent to admin. They will update the design.");
      
    } catch (err) {
      console.error("❌ Failed to reject design:", err);
      alert("Failed to send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/images/dummy-images/image 3.png";
    if (imagePath.startsWith("http")) return imagePath;
    let filename = imagePath;
    if (imagePath.includes("/")) {
      filename = imagePath.split("/").pop();
    }
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-white">Loading designs...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.designApproval} />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Design Approval</h1>
            <p className="text-sm text-gray-400">Review and approve your designs</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {designs.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-slate-900/30 py-16 text-center">
              <div className="mb-4 text-6xl">🎨</div>
              <h3 className="mb-2 text-xl font-semibold text-white">No designs pending approval</h3>
              <p className="text-gray-400">You don't have any designs waiting for your review</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {designs.map((design) => (
                <div key={design._id} className="overflow-hidden rounded-xl border border-gray-800 bg-slate-900/50 backdrop-blur-sm">
                  <div className="p-6">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-400">Design for</p>
                        <h3 className="text-xl font-bold text-white">{design.productId?.name || "Product"}</h3>
                        <p className="mt-1 text-xs text-gray-500">Order #{design.orderId?.orderNumber}</p>
                      </div>
                      <StatusBadge status="Pending" />
                    </div>

                    <div className="mb-4 rounded-lg bg-slate-800 p-2">
                      {design.designUrl ? (
                        <img 
                          src={getImageUrl(design.designUrl)} 
                          alt="Design preview"
                          className="h-48 w-full rounded object-contain"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center text-gray-500">
                          No preview available
                        </div>
                      )}
                    </div>

                    <p className="mb-4 text-sm text-gray-400">
                      Version {design.version} • Uploaded {new Date(design.createdAt).toLocaleDateString()}
                    </p>

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
        </div>
      </DashboardLayout>

      {showRejectModal && selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-800 bg-slate-900">
            <div className="border-b border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white">Request Design Changes</h3>
            </div>
            
            <div className="space-y-4 p-6">
              <p className="text-sm text-gray-400">
                Please provide feedback on what changes are needed for the design. You can also upload reference images.
              </p>

              <Textarea
                placeholder="Describe what needs to be changed..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-white"
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Upload Reference Images (Optional)
                </label>
                <div className="rounded-lg border-2 border-dashed border-gray-700 p-4 text-center transition-colors hover:border-primary/50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="feedback-attachments"
                  />
                  <label htmlFor="feedback-attachments" className="cursor-pointer">
                    <svg className="mx-auto mb-2 h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB (max 5 files)</p>
                  </label>
                </div>
              </div>

              {feedbackFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-300">Selected Files:</p>
                  {feedbackFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg bg-slate-800 p-2">
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
                    setShowRejectModal(false);
                    setSelectedDesign(null);
                    setRejectReason("");
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
                  {submitting ? "Sending..." : "Send Feedback"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}