'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';

export default function CustomerBriefPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [formData, setFormData] = useState({
    designInstructions: '',
    voiceBriefing: null,
    logos: [],
    imagery: [],
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field, files) => {
    const fileArray = Array.from(files);
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), ...fileArray],
    }));
  };

  const startRecording = () => {
    setIsRecording(true);
    // Simulate recording timer
    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 0.1);
    }, 100);
    // In real app, this would start actual audio recording
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
  };

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Studio
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Project Briefing</h1>
          <p className="text-gray-400">Provide details for our designers to create exactly what you need.</p>
        </div>

        <div className="space-y-8">
          {/* Design Instructions */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Design Instructions</h2>
            <Textarea
              placeholder='Describe your visions here... e.g., "Modern minimalistic look with a focus on our brand\'s primary red accent ..."'
              value={formData.designInstructions}
              onChange={(e) => handleInputChange('designInstructions', e.target.value)}
              rows={6}
              className="bg-dark-light"
            />
          </section>

          {/* Voice Briefing */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Voice Briefing</h2>
            <div className="bg-dark-light rounded-lg p-8 border border-dark-lighter relative">
              <div className="absolute top-4 right-4 text-primary font-semibold">
                {recordingTime.toFixed(2)}
              </div>
              <div className="flex items-center justify-center min-h-[200px]">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-primary hover:bg-primary-dark'
                  }`}
                >
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </section>

          {/* Asset Uploads */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Asset Uploads</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-dark-lighter rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".svg,.png,.jpg,.pdf"
                  multiple
                  onChange={(e) => handleFileUpload('logos', e.target.files)}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-white font-medium mb-1">Add Logos or Imagery</p>
                  <p className="text-gray-400 text-sm">SVG, PNG, JPG, PDF UP TO 50MB</p>
                </label>
              </div>
              <div className="border-2 border-dashed border-dark-lighter rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload('imagery', e.target.files)}
                  className="hidden"
                  id="imagery-upload"
                />
                <label htmlFor="imagery-upload" className="cursor-pointer">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-white font-medium mb-1">No Assets Attached</p>
                  <p className="text-gray-400 text-sm">Upload additional assets</p>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>5 DAYS LEAD TIME</span>
            </div>
          </section>

          {/* Technical Specifications */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">FULL TECHNICAL SPECIFICATIONS</h2>
            <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter space-y-4">
              <div>
                <label className="text-gray-400 text-sm">BASE DIMENSIONS</label>
                <Input
                  placeholder="Enter dimensions"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">All Sizes (S-XXL)</label>
                <p className="text-white mt-1">All Sizes (S-XXL)</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">PRODUCTION MOQ</label>
                <p className="text-white mt-1">20 Units</p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
            >
              Save & Continue Later
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push(`/orders/summary?productId=${productId}`)}
              className="flex-1"
            >
              Continue to Order
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
