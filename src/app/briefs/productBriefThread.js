'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { customerBriefService } from '@/services/customerBriefService';
import { formatDistanceToNow } from 'date-fns';
import Button from '@/components/ui/Button';

export default function ProductBriefThread({ orderId, productId, productName, orderNumber }) {
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);

  useEffect(() => {
    fetchFullConversation();
  }, [orderId, productId]);

  const fetchFullConversation = async () => {
    try {
      setLoading(true);
      const response = await customerBriefService.getByOrderAndProduct(orderId, productId);
      
      let data = null;
      if (response?.data) {
        data = response.data;
      } else if (response) {
        data = response;
      }
      
      setConversation(data);
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsViewed = async (briefId) => {
    try {
      await customerBriefService.markAsViewed(briefId);
      fetchFullConversation();
    } catch (error) {
      console.error('Failed to mark as viewed:', error);
    }
  };

  const handleRespond = async () => {
    if (!responseText.trim()) return;

    try {
      setResponding(true);
      await customerBriefService.submit(orderId, productId, { description: responseText });
      setResponseText('');
      setShowResponseForm(false);
      fetchFullConversation();
    } catch (error) {
      console.error('Failed to send response:', error);
    } finally {
      setResponding(false);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'customer': return '👤';
      case 'admin': return '👨‍💼';
      case 'superAdmin': return '👑';
      default: return '📝';
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'customer': return 'bg-blue-900/30 text-blue-400 border-blue-700';
      case 'admin': return 'bg-green-900/30 text-green-400 border-green-700';
      case 'superAdmin': return 'bg-purple-900/30 text-purple-400 border-purple-700';
      default: return 'bg-gray-900/30 text-gray-400 border-gray-700';
    }
  };

  const getRoleName = (role) => {
    switch(role) {
      case 'customer': return 'You';
      case 'admin': return 'Admin';
      case 'superAdmin': return 'Super Admin';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 sm:py-12">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasCustomerBrief = !!conversation?.customer;
  const hasAdminResponse = !!(conversation?.admin || conversation?.superAdmin);

  const allMessages = [];
  if (conversation?.customer) {
    allMessages.push({ ...conversation.customer, role: 'customer', sortDate: conversation.customer.createdAt });
  }
  if (conversation?.admin) {
    allMessages.push({ ...conversation.admin, role: 'admin', sortDate: conversation.admin.createdAt });
  }
  if (conversation?.superAdmin) {
    allMessages.push({ ...conversation.superAdmin, role: 'superAdmin', sortDate: conversation.superAdmin.createdAt });
  }

  const sortedMessages = allMessages.sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate));

  return (
    <div className="space-y-4 sm:space-y-6">
      <SEOHead 
        {...METADATA.briefs} 
        title={`${productName} | Customization Conversation`}
      />
      
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Customization Conversation</h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Order #{orderNumber} • {productName}
            </p>
          </div>
          <Link href={`/orders/${orderId}`}>
            <Button variant="ghost" size="sm" className="w-full sm:w-auto">
              Back to Order
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {sortedMessages.map((message, index) => (
          <div
            key={`${message.role}-${message._id || index}`}
            className={`flex ${message.role === 'customer' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] rounded-lg p-3 sm:p-4 ${
                message.role === 'customer'
                  ? 'bg-blue-900/20 border border-blue-800'
                  : 'bg-green-900/20 border border-green-800'
              }`}
            >
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${getRoleColor(message.role)} flex items-center justify-center text-xs border`}>
                  {getRoleIcon(message.role)}
                </div>
                <span className="text-xs font-medium text-white">
                  {getRoleName(message.role)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </span>
                {message.role !== 'customer' && !conversation?.customer?.viewed && (
                  <button
                    onClick={() => handleMarkAsViewed(message._id)}
                    className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full hover:bg-yellow-600/30 transition"
                  >
                    Mark as viewed
                  </button>
                )}
                {message.role !== 'customer' && conversation?.customer?.viewed && (
                  <span className="text-xs text-green-400">✓ Viewed</span>
                )}
              </div>

              {message.description && (
                <p className="text-gray-300 text-xs sm:text-sm whitespace-pre-wrap mb-3">
                  {message.description}
                </p>
              )}

              {message.designId && (
                <div className="mt-2">
                  <Link href={`/designs/${message.designId}`}>
                    <span className="text-xs bg-purple-900/30 text-purple-400 px-2 sm:px-3 py-1 rounded-full inline-flex items-center gap-1 hover:bg-purple-900/50 transition">
                      <span>🎨</span> View Design
                    </span>
                  </Link>
                </div>
              )}

              <div className="flex flex-wrap gap-1 sm:gap-2 mt-3">
                {message.image && (
                  <a
                    href={message.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 sm:px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    <span>📷</span> Image
                  </a>
                )}
                {message.voiceNote && (
                  <button
                    onClick={() => new Audio(message.voiceNote).play()}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-green-400 px-2 sm:px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    <span>🎤</span> Voice Note
                  </button>
                )}
                {message.video && (
                  <a
                    href={message.video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-red-400 px-2 sm:px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    <span>🎥</span> Video
                  </a>
                )}
                {message.logo && (
                  <a
                    href={message.logo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-purple-400 px-2 sm:px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    <span>🎨</span> Logo
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {!hasCustomerBrief && !hasAdminResponse && (
          <div className="text-center py-8 sm:py-12 bg-slate-900/30 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-sm sm:text-base mb-4">No messages yet for this product</p>
            <Link href={`/orders/${orderId}/products/${productId}/respond`}>
              <Button variant="primary" size="md" className="w-full sm:w-auto">
                Start Conversation
              </Button>
            </Link>
          </div>
        )}
      </div>

      {hasAdminResponse && (
        <div className="mt-6 sm:mt-8 border-t border-gray-800 pt-6">
          {showResponseForm ? (
            <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Your Response</h3>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response here..."
                rows={4}
                className="w-full bg-slate-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary text-sm sm:text-base"
              />
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseText('');
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRespond}
                  loading={responding}
                  disabled={!responseText.trim()}
                  className="w-full sm:w-auto"
                >
                  Send Response
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowResponseForm(true)}
                className="w-full sm:w-auto"
              >
                Reply to Admin
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}