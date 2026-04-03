"use client";

import Link from "next/link";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import CollectionCard from "@/components/cards/CollectionCard";
import SEOHead from "@/components/common/SEOHead";
import { METADATA } from "@/lib/metadata";

export default function NewOrderPage() {
  const essentialSolutions = [
    { id: 1, name: "BRAND ESSENTIALS", desc: "Credible, foundational business materials.", image: "/images/collection/nylons/1.jpg" },
    { id: 2, name: "MARKETING PRINTS", desc: "High-impact promotional paper prints.", image: "/images/collection/paperbags/bagpp.webp" },
    { id: 3, name: "PACKAGING & CARRY", desc: "Custom boxes, bags and labels.", image: null },
    { id: 4, name: "PREMIUM FINISHING", desc: "Luxury foils and embossed detailing.", image: null },
  ];

  return (
    <>
      <SEOHead {...METADATA.products} title="Start New Order" />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="mb-4 inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
              CREATIVE PRINT MARKETPLACE
            </div>
            <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Start building your <span className="text-primary">physical</span> brand kit.
            </h1>
            <p className="mb-8 max-w-2xl text-base text-gray-400 sm:text-lg">
              From foundational Brand Essentials to elite Large Format signage. Experience the highest standard of industrial printing precision.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Essential Solutions</h2>
            <p className="mb-6 text-gray-400">The foundations of a professional corporate identity.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {essentialSolutions.map((solution) => (
                <div key={solution.id} className="overflow-hidden rounded-lg border border-dark-lighter bg-slate-900 transition-all hover:border-primary/50">
                  <div className="relative h-48 bg-slate-950">
                    {solution.image ? (
                      <img src={solution.image} alt={solution.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-500">
                        <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 text-lg font-semibold text-white">{solution.name}</h3>
                    <p className="mb-4 text-sm text-gray-400">{solution.desc}</p>
                    <Link href={`/collections/${solution.id}/products`} className="text-sm font-medium text-primary hover:text-primary-light">
                      EXPLORE →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-dark-lighter bg-slate-900 p-6 sm:p-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { step: 1, title: "Choose Foundation", desc: "Select from our library of premium materials and product types." },
                { step: 2, title: "Voice Your Needs", desc: "Record an audio brief or upload assets. Our designers take it from there." },
                { step: 3, title: "Review & Print", desc: "Approve designs in 24h and watch your production move to delivery." },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-white">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}