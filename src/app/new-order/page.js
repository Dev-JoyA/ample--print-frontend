'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import CollectionCard from '@/components/cards/CollectionCard';

export default function NewOrderPage() {
  const essentialSolutions = [
    { id: 1, name: 'BRAND ESSENTIALS', desc: 'Credible, foundational business materials.', image: '/images/collection/nylons/1.jpg' },
    { id: 2, name: 'MARKETING PRINTS', desc: 'High-impact promotional paper prints.', image: '/images/collection/paperbags/bagpp.webp' },
    { id: 3, name: 'PACKAGING & CARRY', desc: 'Custom boxes, bags and labels.', image: null },
    { id: 4, name: 'PREMIUM FINISHING', desc: 'Luxury foils and embossed detailing.', image: null },
  ];

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold mb-4">
            CREATIVE PRINT MARKETPLACE
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Start building your <span className="text-primary">physical</span> brand kit.
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl">
            From foundational Brand Essentials to elite Large Format signage. Experience the highest standard of industrial printing precision.
          </p>
          <div className="flex gap-4">
            <Link href="/collections">
              <Button variant="primary" size="lg" icon="→" iconPosition="right">
                Explore Print Solutions
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Start Custom Brief
            </Button>
          </div>
        </div>

        {/* Essential Solutions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Essential Solutions</h2>
          <p className="text-gray-400 mb-6">The foundations of a professional corporate identity.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {essentialSolutions.map((solution) => (
              <div key={solution.id} className="bg-dark-light rounded-lg overflow-hidden border border-dark-lighter hover:border-primary/50 transition-all">
                <div className="relative h-48 bg-dark">
                  {solution.image ? (
                    <img src={solution.image} alt={solution.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{solution.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{solution.desc}</p>
                  <Link href={`/collections/${solution.id}/products`} className="text-primary hover:text-primary-light text-sm font-medium">
                    EXPLORE →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Process Steps */}
        <div className="bg-dark-light rounded-lg p-8 border border-dark-lighter">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Choose Foundation', desc: 'Select from our library of premium materials and product types.' },
              { step: 2, title: 'Voice Your Needs', desc: 'Record an audio brief or upload assets. Our designers take it from there.' },
              { step: 3, title: 'Review & Print', desc: 'Approve designs in 24h and watch your production move to delivery.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
