'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';

export default function CustomerBriefsPage() {
  const [briefs] = useState([
    {
      id: 1,
      orderNumber: 'ORD-7291',
      productName: 'Premium A5 Marketing Flyers',
      designInstructions: 'Modern minimalistic look with a focus on our brand\'s primary red accent',
      hasVoiceBrief: true,
      assetsCount: 2,
      submittedDate: '2025-12-12',
    },
  ]);

  const [selectedBrief, setSelectedBrief] = useState(null);
  const [response, setResponse] = useState('');

  const handleRespond = (briefId) => {
    console.log('Respond to brief:', briefId, response);
    // In real app, this would save the response
  };

  return (
    <DashboardLayout userRole="admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Customer Briefs</h1>
          <p className="text-gray-400">Review and respond to customer design briefs</p>
        </div>

        <div className="space-y-6">
          {briefs.map((brief) => (
            <div key={brief.id} className="bg-slate-900 rounded-lg p-6 border border-dark-lighter">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{brief.productName}</h3>
                  <p className="text-gray-400 text-sm">{brief.orderNumber} • Submitted on {brief.submittedDate}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Design Instructions</p>
                  <p className="text-white">{brief.designInstructions}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Voice Briefing: {brief.hasVoiceBrief ? 'Yes' : 'No'}</span>
                  <span>Assets: {brief.assetsCount} files</span>
                </div>
              </div>

              {selectedBrief === brief.id ? (
                <div className="space-y-4">
                  <Textarea
                    label="Your Response"
                    placeholder="Provide feedback or ask questions..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-4">
                    <Button
                      variant="primary"
                      onClick={() => handleRespond(brief.id)}
                    >
                      Send Response
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedBrief(null);
                        setResponse('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setSelectedBrief(brief.id)}
                >
                  Respond to Brief
                </Button>
              )}
            </div>
          ))}
        </div>

        {briefs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No customer briefs found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
