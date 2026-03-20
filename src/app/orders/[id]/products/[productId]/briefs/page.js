"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import SEOHead from "@/components/common/SEOHead";
import { useProtectedRoute } from "@/app/lib/auth";
import { orderService } from "@/services/orderService";
import ProductBriefThread from "@/app/briefs/productBriefThread";
import { METADATA } from "@/lib/metadata";

export default function ProductBriefsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;
  const productId = params.productId;

  const { isLoading: authLoading } = useProtectedRoute({
    redirectTo: "/auth/sign-in"
  });

  const [order, setOrder] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && orderId) {
      fetchOrderDetails();
    }
  }, [authLoading, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await orderService.getById(orderId);
      const orderData = response?.order || response?.data || response;

      if (!orderData) {
        setError("Order not found");
        return;
      }

      setOrder(orderData);

      const item = orderData.items?.find(
        (i) => (i.productId._id || i.productId) === productId
      );

      if (!item) {
        setError("Product not found in this order");
      }

      setProduct(item);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-xl border border-red-800 bg-red-900/20 p-8 text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <p className="mb-4 text-red-400">{error}</p>
            <button
              onClick={() => router.back()}
              className="rounded-lg bg-red-600 px-6 py-2 text-white transition hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pageTitle = product?.productName
    ? `${product.productName} - Customization Brief`
    : "Product Customization Brief";

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={`View and manage customization brief for ${product?.productName || "product"}. Submit your design requirements and communicate with our team.`}
      />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Order
            </button>

            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Customization Brief
              </h1>
              <p className="text-sm text-gray-400">
                Order #{order?.orderNumber}
              </p>
            </div>
          </div>

          <ProductBriefThread
            orderId={orderId}
            productId={productId}
            productName={product?.productName || "Product"}
            orderNumber={order?.orderNumber}
          />
        </div>
      </DashboardLayout>
    </>
  );
}