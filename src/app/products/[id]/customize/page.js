'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import SEOHead from '@/components/common/SEOHead';
import { useAuthCheck } from '@/app/lib/auth';
import { productService } from '@/services/productService';
import { METADATA, getProductMetadata } from '@/lib/metadata';

export default function CustomerBriefPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  useAuthCheck();

  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [formData, setFormData] = useState({
    designInstructions: '',
    voiceBriefing: null,
    logos: [],
    imagery: [],
  });

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setProductLoading(true);
      const response = await productService.getById(productId);
      const productData = response?.product || response?.data || response;
      setProduct(productData);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setProductLoading(false);
    }
  };

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], `voice_briefing_${Date.now()}.wav`, { type: 'audio/wav' });
        handleInputChange('voiceBriefing', audioFile);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 0.1);
      }, 100);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const removeFile = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    // In real app, submit brief data
    console.log('Submitting brief:', { productId, ...formData });
    router.push(`/orders/summary?productId=${productId}`);
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (productLoading) {
    return (
      <>
        <SEOHead
          title="Loading Product..."
          description="Please wait while we load product details"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole="customer">
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-white">Loading product details...</div>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={`Customize ${product?.name || 'Product'}`}
        description={`Provide design instructions for ${product?.name || 'your custom print'}`}
        {...(product && getProductMetadata(product))}
      />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white sm:mb-6"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Studio
          </button>

          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Project Briefing</h1>
            <p className="mt-1 text-sm text-gray-400 sm:mt-2 sm:text-base">Provide details for our designers to create exactly what you need.</p>
            {product && (
              <p className="mt-2 text-sm text-primary sm:mt-3">Product: {product.name}</p>
            )}
          </div>

          <div className="space-y-6 sm:space-y-8">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-white sm:mb-4 sm:text-2xl">Design Instructions</h2>
              <Textarea
                className="bg-slate-900"
                placeholder={`Describe your visions here... e.g., "Modern minimalistic look with a focus on our brand's primary red accent ..."`}
                value={formData.designInstructions}
                onChange={(e) => handleInputChange('designInstructions', e.target.value)}
                rows={5}
              />
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white sm:mb-4 sm:text-2xl">Voice Briefing</h2>
              <div className="relative rounded-xl border border-gray-700 bg-slate-900 p-6 sm:p-8">
                <div className="absolute left-0 right-0 top-3 flex items-center justify-between px-4 sm:top-4 sm:px-6">
                  <h2 className="text-xs font-bold sm:text-sm">AUDIO INTERFACE</h2>
                  <p className="font-semibold text-primary text-sm sm:text-base">
                    {formatRecordingTime(recordingTime)}
                  </p>
                </div>
                <div className="flex min-h-[160px] items-center justify-center sm:min-h-[200px]">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex h-16 w-16 items-center justify-center rounded-full transition-all sm:h-20 sm:w-20 ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-primary hover:bg-primary-dark'
                    }`}
                  >
                    <svg className="h-8 w-8 text-white sm:h-10 sm:w-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  </button>
                </div>
              </div>
              {formData.voiceBriefing && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-700 bg-slate-800 p-3">
                  <span className="text-xs text-gray-300 truncate sm:text-sm">
                    {formData.voiceBriefing.name}
                  </span>
                  <button
                    onClick={() => handleInputChange('voiceBriefing', null)}
                    className="text-xs text-red-400 hover:text-red-300 sm:text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white sm:mb-4 sm:text-2xl">Asset Uploads</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="cursor-pointer rounded-lg border-2 border-dashed border-dark-lighter p-4 text-center transition-colors hover:border-primary sm:p-6">
                  <input
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg,.pdf"
                    multiple
                    onChange={(e) => handleFileUpload('logos', e.target.files)}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <svg className="mx-auto mb-2 h-10 w-10 text-gray-400 sm:mb-3 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-white sm:text-base">Add Logos or Imagery</p>
                    <p className="text-xs text-gray-400">SVG, PNG, JPG, PDF UP TO 50MB</p>
                  </label>
                </div>
                <div className="cursor-pointer rounded-lg border-2 border-dashed border-dark-lighter p-4 text-center transition-colors hover:border-primary sm:p-6">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload('imagery', e.target.files)}
                    className="hidden"
                    id="imagery-upload"
                  />
                  <label htmlFor="imagery-upload" className="cursor-pointer">
                    <svg className="mx-auto mb-2 h-10 w-10 text-gray-400 sm:mb-3 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-white sm:text-base">No Assets Attached</p>
                    <p className="text-xs text-gray-400">Upload additional image</p>
                  </label>
                </div>
              </div>

              {formData.logos.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-gray-400">Logos ({formData.logos.length})</p>
                  <div className="space-y-2">
                    {formData.logos.map((file, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border border-gray-700 bg-slate-800 p-3">
                        <span className="text-xs text-gray-300 truncate sm:text-sm">{file.name}</span>
                        <button
                          onClick={() => removeFile('logos', index)}
                          className="text-xs text-red-400 hover:text-red-300 sm:text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.imagery.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-gray-400">Imagery ({formData.imagery.length})</p>
                  <div className="space-y-2">
                    {formData.imagery.map((file, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border border-gray-700 bg-slate-800 p-3">
                        <span className="text-xs text-gray-300 truncate sm:text-sm">{file.name}</span>
                        <button
                          onClick={() => removeFile('imagery', index)}
                          className="text-xs text-red-400 hover:text-red-300 sm:text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 sm:mt-4 sm:text-sm">
                <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>5 DAYS LEAD TIME</span>
              </div>
            </section>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
              <Button
                variant="secondary"
                onClick={() => router.back()}
                className="flex-1 border border-gray-700"
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                className="flex-1"
              >
                Continue to Order
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}