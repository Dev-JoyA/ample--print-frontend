'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function DesignUploadPage() {
  const [selectedOrder, setSelectedOrder] = useState('');
  const [designFiles, setDesignFiles] = useState([]);

  const orders = [
    { id: 1, orderNumber: 'ORD-7291', productName: 'Premium A5 Marketing Flyers' },
    { id: 2, orderNumber: 'ORD-8822', productName: 'Photo Books' },
  ];

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setDesignFiles([...designFiles, ...files]);
  };

  const handleUpload = () => {
    console.log('Upload designs for order:', selectedOrder, designFiles);
    // In real app, this would upload the designs
  };

  const removeFile = (index) => {
    setDesignFiles(designFiles.filter((_, i) => i !== index));
  };

  return (
    <DashboardLayout userRole="admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Design Upload</h1>
          <p className="text-gray-400">Upload designs for customer orders</p>
        </div>

        <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter space-y-6">
          {/* Order Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Order
            </label>
            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark border border-dark-lighter rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Choose an order...</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.productName}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Design Files
            </label>
            <div className="border-2 border-dashed border-dark-lighter rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*,.pdf,.ai,.psd"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="design-upload"
              />
              <label htmlFor="design-upload" className="cursor-pointer">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-gray-400 text-sm">PNG, JPG, PDF, AI, PSD (MAX. 50MB)</p>
              </label>
            </div>
          </div>

          {/* Uploaded Files List */}
          {designFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-300">Uploaded Files:</p>
              {designFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-dark rounded-lg p-3">
                  <span className="text-white text-sm">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedOrder('');
                setDesignFiles([]);
              }}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!selectedOrder || designFiles.length === 0}
              className="flex-1"
            >
              Upload Designs
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
