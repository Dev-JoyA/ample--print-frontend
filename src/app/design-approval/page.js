'use client';

import { useState } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';

export default function DesignApprovalPage() {
  const [designs] = useState([
    {
      id: 1,
      orderNumber: 'ORD-7291',
      productName: 'Premium A5 Marketing Flyers',
      designImages: ['/images/collection/nylons/1.jpg', '/images/collection/nylons/1.jpg'],
      submittedDate: '2025-12-12',
      status: 'PENDING',
    },
    {
      id: 2,
      orderNumber: 'ORD-8822',
      productName: 'Photo Books',
      designImages: ['/images/collection/paperbags/bagpp.webp'],
      submittedDate: '2025-12-12',
      status: 'PENDING',
    },
  ]);

  const handleApprove = (designId) => {
    console.log('Approve design:', designId);
    // In real app, this would update the design status
  };

  const handleReject = (designId) => {
    console.log('Reject design:', designId);
    // In real app, this would update the design status and allow feedback
  };

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Design Approval</h1>
          <p className="text-gray-400">Review and approve designs for your orders</p>
        </div>

        <div className="space-y-6">
          {designs.map((design) => (
            <div key={design.id} className="bg-slate-950 rounded-lg p-6 border border-dark-lighter">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{design.productName}</h3>
                  <p className="text-gray-400 text-sm">{design.orderNumber} • Submitted on {design.submittedDate}</p>
                </div>
                <StatusBadge status={design.status} type="order" />
              </div>

              {/* Design Images */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {design.designImages.map((image, idx) => (
                  <div key={idx} className="relative aspect-square bg-dark rounded-lg overflow-hidden">
                    <Image
                      src={image}
                      alt={`Design ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  variant="primary"
                  onClick={() => handleApprove(design.id)}
                >
                  Approve Design
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleReject(design.id)}
                >
                  Request Changes
                </Button>
              </div>
            </div>
          ))}
        </div>

        {designs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No designs pending approval</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
