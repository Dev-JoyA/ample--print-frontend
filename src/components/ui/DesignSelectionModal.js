'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

const DesignSelectionModal = ({ isOpen, onClose, onConfirm, productName }) => {
  const [hasOwnDesign, setHasOwnDesign] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <span className="text-xl">🎨</span>
          </div>
          <h3 className="text-lg font-bold text-white">Do you have your own design?</h3>
        </div>

        <p className="mb-4 text-sm text-gray-400">
          For <span className="font-semibold text-primary">{productName}</span>
        </p>

        <div className="space-y-3">
          <button
            onClick={() => setHasOwnDesign(true)}
            className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
              hasOwnDesign === true
                ? 'border-primary bg-primary/10'
                : 'border-gray-700 bg-slate-800/30 hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📁</span>
              <div>
                <p className="font-semibold text-white">Yes, I have my own design</p>
                <p className="text-xs text-gray-400">
                  I will upload my design files (AI, EPS, PDF, PNG, JPG)
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setHasOwnDesign(false)}
            className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
              hasOwnDesign === false
                ? 'border-primary bg-primary/10'
                : 'border-gray-700 bg-slate-800/30 hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✏️</span>
              <div>
                <p className="font-semibold text-white">No, I need design assistance</p>
                <p className="text-xs text-gray-400">
                  I will provide instructions and our designers will create the design
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Note about extra cost */}
        <div className="mt-4 rounded-lg border border-yellow-800 bg-yellow-900/20 p-3">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs text-yellow-400">
              <span className="font-medium">Note:</span> If you select design assistance, an
              additional design fee will be added to your invoice. Providing your own design files
              helps avoid this extra cost.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (hasOwnDesign !== null) {
                onConfirm(hasOwnDesign);
              }
            }}
            disabled={hasOwnDesign === null}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DesignSelectionModal;
