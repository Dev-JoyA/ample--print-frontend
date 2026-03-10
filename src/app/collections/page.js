'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import CollectionCard from '@/components/cards/CollectionCard';
import Button from '@/components/ui/Button';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { collectionService } from '@/services/collectionService';
import { getToken } from '@/lib/api';

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is authenticated by looking for token
    const token = getToken();
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await collectionService.getAll({ limit: 100 });
      
      let collectionsData = [];
      if (response?.collections && Array.isArray(response.collections)) {
        collectionsData = response.collections;
      } else if (Array.isArray(response)) {
        collectionsData = response;
      } else if (response?.data?.collections) {
        collectionsData = response.data.collections;
      }

      // For each collection, fetch its products to get count and thumbnail
      const collectionsWithDetails = await Promise.all(
        collectionsData.map(async (collection) => {
          try {
            const productsRes = await collectionService.getCollectionProducts(collection._id);
            let products = [];
            if (productsRes?.products && Array.isArray(productsRes.products)) {
              products = productsRes.products;
            } else if (Array.isArray(productsRes)) {
              products = productsRes;
            } else if (productsRes?.data && Array.isArray(productsRes.data)) {
              products = productsRes.data;
            }

            // Get the first product's image as thumbnail
            let thumbnail = null;
            if (products[0]?.image) {
              thumbnail = products[0].image;
            } else if (products[0]?.images?.[0]) {
              thumbnail = products[0].images[0];
            }

            // Format image URL
            if (thumbnail) {
              if (!thumbnail.startsWith('http')) {
                let filename = thumbnail;
                if (thumbnail.includes('/')) {
                  filename = thumbnail.split('/').pop();
                }
                thumbnail = `http://localhost:4001/api/v1/attachments/download/${filename}`;
              }
            } else {
              // Use placeholder if no image
              thumbnail = null;
            }

            return {
              id: collection._id,
              name: collection.name,
              description: `Premium ${collection.name.toLowerCase()} for your business needs`,
              image: thumbnail,
              productCount: products.length
            };
          } catch (err) {
            console.error(`Failed to fetch products for collection ${collection._id}:`, err);
            return {
              id: collection._id,
              name: collection.name,
              description: `Premium ${collection.name.toLowerCase()} for your business needs`,
              image: null,
              productCount: 0
            };
          }
        })
      );

      setCollections(collectionsWithDetails);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  // Public layout without sidebar
  const PublicLayout = ({ children }) => (
    <div className="min-h-screen  bg-gradient-to-b from-slate-950 to-slate-900">
      <Header showSearch={true} />
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );

  // Loading skeletons
  if (loading) {
    const LoadingSkeleton = () => (
      <div className="max-w-7xl mx-auto">
        {/* Hero Section Skeleton */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 bg-primary/20 rounded-full w-48 h-6 animate-pulse mb-4"></div>
          <div className="h-12 w-3/4 bg-slate-800 rounded-lg mb-4 animate-pulse"></div>
          <div className="h-6 w-1/2 bg-slate-800 rounded-lg mb-8 animate-pulse"></div>
        </div>

        {/* Essential Solutions Skeleton */}
        <div className="mb-12">
          <div className="h-8 w-64 bg-slate-800 rounded-lg mb-2 animate-pulse"></div>
          <div className="h-5 w-96 bg-slate-800 rounded-lg mb-6 animate-pulse"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-slate-900 rounded-lg overflow-hidden border border-dark-lighter">
                <div className="h-48 bg-slate-800 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 w-3/4 bg-slate-800 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-slate-800 rounded animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-slate-800 rounded animate-pulse"></div>
                  <div className="h-5 w-24 bg-primary/20 rounded animate-pulse mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    const Content = <LoadingSkeleton />;
    return isAuthenticated ? (
      <DashboardLayout userRole="customer">
        {Content}
      </DashboardLayout>
    ) : (
      <PublicLayout>{Content}</PublicLayout>
    );
  }

  // Error state
  if (error) {
    const ErrorContent = (
      <div className="max-w-7xl mx-auto text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-600/20 mb-6">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Oops! Something went wrong</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
        <Button onClick={fetchCollections} variant="primary" size="lg">
          Try Again
        </Button>
      </div>
    );

    return isAuthenticated ? (
      <DashboardLayout userRole="customer">
        {ErrorContent}
      </DashboardLayout>
    ) : (
      <PublicLayout>{ErrorContent}</PublicLayout>
    );
  }

  // Main content with real data
  const MainContent = (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold mb-4">
          CREATIVE PRINT MARKETPLACE
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
          Start building your <span className="text-primary">physical</span> brand kit.
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-2xl ">
          From foundational Brand Essentials to elite Large Format signage. Experience the highest standard of industrial printing precision.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-4">
          <Link href="/collections/all/products">
            <Button variant="primary" size="lg" icon="→" iconPosition="right">
              View All Products
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link href="/auth/sign-up">
              <Button variant="outline" size="lg">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Essential Solutions - Collections Grid */}
      <div className="mb-16 ">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Essential Solutions</h2>
            <p className="text-gray-400">The foundations of a professional corporate identity.</p>
          </div>
          {/* <Link 
            href="/collections/all/products" 
            className="text-primary hover:text-primary-light text-sm font-medium hidden sm:block"
          >
            VIEW ALL COLLECTIONS →
          </Link> */}
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Collections Yet</h3>
            <p className="text-gray-400">Check back soon for new collections!</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mx-[4rem]">
              {collections.map((collection) => (
                <Link 
                  key={collection.id} 
                  href={`/collections/${collection.id}/products`}
                  className="group transform hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="bg-slate-900 rounded-lg overflow-hidden border border-dark-lighter hover:border-primary/50 transition-all h-full">
                    <div className="relative h-56 bg-slate-950 overflow-hidden">
                      {collection.image ? (
                        <img 
                          src={collection.image} 
                          alt={collection.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Product Count Badge */}
                      <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-gray-700">
                        {collection.productCount} {collection.productCount <= 1 ? 'item' : 'items'}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                        {collection.name}
                      </h3>
                      {/* <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {collection.description || `Premium ${collection.name.toLowerCase()} for your business needs.`}
                      </p> */}
                      <span className="text-primary hover:text-primary-light text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        EXPLORE COLLECTION 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile View All Link */}
            <div className="mt-6 text-center sm:hidden">
              <Link 
                href="/collections/all/products" 
                className="text-primary hover:text-primary-light text-sm font-medium"
              >
                VIEW ALL COLLECTIONS →
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Process Steps */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-8 md:p-12 border border-dark-lighter mb-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              step: 1, 
              title: 'Choose Product', 
              desc: 'Select from our library of premium products.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )
            },
            { 
              step: 2, 
              title: 'Voice Your Needs', 
              desc: 'Customize your product to meet your need, upload logo, record an audio brief or upload any other items to help us understand your vision. Our designers will take it from there.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )
            },
            { 
              step: 3, 
              title: 'Review & Print', 
              desc: 'Approve designs in  24h and watch your production move to delivery.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 relative">
                {item.step}
                <div className="absolute inset-0 rounded-full animate-ping bg-primary/20"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-2xl p-8 md:p-12 border border-primary/30 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Project?</h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Join thousands of businesses that trust us with their printing needs. Get started today and bring your ideas to life.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/collections/all/products">
            <Button variant="primary" size="lg">
              Browse All Products
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link href="/auth/sign-up">
              <Button variant="outline" size="lg">
                Create Account
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return isAuthenticated ? (
    <DashboardLayout userRole="customer">
      {MainContent}
    </DashboardLayout>
  ) : (
    <PublicLayout>{MainContent}</PublicLayout>
  );
}