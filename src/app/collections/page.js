'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import CollectionCard from '@/components/cards/CollectionCard';
import Button from '@/components/ui/Button';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { collectionService } from '@/services/collectionService';
import { getToken } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
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

            let thumbnail = null;
            if (products.length > 0) {
              const firstProduct = products[0];
              const imagePath = firstProduct.image || firstProduct.images?.[0];
              if (imagePath) {
                thumbnail = getImageUrl(imagePath);
              }
            }

            return {
              id: collection._id,
              name: collection.name,
              description: `Premium ${collection.name.toLowerCase()} for your business needs`,
              image: thumbnail,
              productCount: products.length,
            };
          } catch (err) {
            console.error(`Failed to fetch products for collection ${collection._id}:`, err);
            return {
              id: collection._id,
              name: collection.name,
              description: `Premium ${collection.name.toLowerCase()} for your business needs`,
              image: null,
              productCount: 0,
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

  const PublicLayout = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <Header showSearch={true} />
      <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">{children}</main>
      <Footer />
    </div>
  );

  if (loading) {
    const LoadingSkeleton = () => (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <div className="mb-3 inline-block h-5 w-40 animate-pulse rounded-full bg-primary/20 sm:mb-4 sm:h-6 sm:w-48"></div>
          <div className="mb-3 h-8 w-full rounded-lg bg-slate-800 sm:mb-4 sm:h-10 md:h-12 lg:w-3/4"></div>
          <div className="h-4 w-2/3 rounded-lg bg-slate-800 sm:h-5 lg:w-1/2"></div>
        </div>

        <div className="mb-8 sm:mb-12">
          <div className="mb-2 h-6 w-48 animate-pulse rounded-lg bg-slate-800 sm:h-8"></div>
          <div className="mb-4 h-4 w-72 animate-pulse rounded-lg bg-slate-800 sm:mb-6 sm:h-5"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-lg border border-dark-lighter bg-slate-900"
              >
                <div className="h-40 animate-pulse bg-slate-800 sm:h-48"></div>
                <div className="space-y-2 p-3 sm:p-4">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-slate-800 sm:h-6"></div>
                  <div className="h-3 w-full animate-pulse rounded bg-slate-800 sm:h-4"></div>
                  <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800 sm:h-4"></div>
                  <div className="mt-2 h-4 w-24 animate-pulse rounded bg-primary/20 sm:mt-4 sm:h-5"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    const Content = <LoadingSkeleton />;
    return isAuthenticated ? (
      <DashboardLayout userRole="customer">{Content}</DashboardLayout>
    ) : (
      <PublicLayout>{Content}</PublicLayout>
    );
  }

  if (error) {
    const ErrorContent = (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:py-16">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20 sm:mb-6 sm:h-20 sm:w-20">
          <svg
            className="h-8 w-8 text-red-400 sm:h-10 sm:w-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-white sm:mb-3 sm:text-2xl">
          Oops! Something went wrong
        </h2>
        <p className="mx-auto mb-4 max-w-md text-sm text-gray-400 sm:mb-6 sm:text-base">{error}</p>
        <Button onClick={fetchCollections} variant="primary" size="md">
          Try Again
        </Button>
      </div>
    );

    return isAuthenticated ? (
      <DashboardLayout userRole="customer">{ErrorContent}</DashboardLayout>
    ) : (
      <PublicLayout>{ErrorContent}</PublicLayout>
    );
  }

  const MainContent = (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 sm:mb-12">
        <div className="mb-3 inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary sm:mb-4">
          CREATIVE PRINT MARKETPLACE
        </div>
        <h1 className="mb-3 text-3xl font-bold leading-tight text-white sm:mb-4 sm:text-4xl md:text-5xl lg:text-6xl">
          Start building your <span className="text-primary">physical</span> brand kit.
        </h1>
        <p className="mb-6 max-w-2xl text-base text-gray-400 sm:mb-8 sm:text-lg">
          From foundational Brand Essentials to elite Large Format signage. Experience the highest
          standard of industrial printing precision.
        </p>

        <div className="flex flex-wrap gap-3 sm:gap-4">
          <Link href="/collections/all/products">
            <Button variant="primary" size="md" icon="→" iconPosition="right">
              View All Products
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link href="/auth/sign-up">
              <Button variant="outline" size="md">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mb-12 sm:mb-16">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mb-1 text-2xl font-bold text-white sm:mb-2 sm:text-3xl">
              Essential Solutions
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              The foundations of a professional corporate identity.
            </p>
          </div>
        </div>

        {collections.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-slate-900/30 py-12 text-center sm:py-16">
            <div className="mb-4 text-5xl sm:text-6xl">📦</div>
            <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">No Collections Yet</h3>
            <p className="text-sm text-gray-400 sm:text-base">
              Check back soon for new collections!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}/products`}
                  className="group transform transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-full overflow-hidden rounded-lg border border-dark-lighter bg-slate-900 transition-all hover:border-primary/50">
                    <div className="relative h-40 overflow-hidden bg-slate-950 sm:h-56">
                      {collection.image ? (
                        <img
                          src={`${collection.image}?t=${Date.now()}`}
                          alt={collection.name}
                          crossOrigin="anonymous"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onLoad={() => console.log('Image loaded successfully:', collection.name)}
                          onError={(e) => {
                            console.error('Image failed to load:', collection.image);
                            e.target.onerror = null;
                            e.target.src = '/images/placeholder.png';
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-600">
                          <svg
                            className="h-12 w-12 sm:h-20 sm:w-20"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="absolute right-2 top-2 rounded-full border border-gray-700 bg-slate-900/90 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm sm:right-3 sm:top-3 sm:px-2 sm:py-1">
                        {collection.productCount} {collection.productCount <= 1 ? 'item' : 'items'}
                      </div>
                    </div>
                    <div className="p-3 sm:p-5">
                      <h3 className="mb-1 text-base font-semibold text-white transition-colors group-hover:text-primary sm:mb-2 sm:text-lg">
                        {collection.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-all group-hover:gap-2 sm:text-sm">
                        EXPLORE COLLECTION
                        <svg
                          className="h-3 w-3 sm:h-4 sm:w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 text-center sm:hidden">
              <Link
                href="/collections/all/products"
                className="text-sm font-medium text-primary hover:text-primary-light"
              >
                VIEW ALL COLLECTIONS →
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="mb-12 rounded-xl border border-dark-lighter bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:mb-16 sm:rounded-2xl sm:p-8 md:p-12">
        <h2 className="mb-8 text-center text-2xl font-bold text-white sm:mb-12 sm:text-3xl">
          How It Works
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          {[
            {
              step: 1,
              title: 'Choose Product',
              desc: 'Select from our library of premium products.',
              icon: (
                <svg
                  className="h-6 w-6 sm:h-8 sm:w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              ),
            },
            {
              step: 2,
              title: 'Voice Your Needs',
              desc: 'Customize your product to meet your need, upload logo, record an audio brief or upload any other items to help us understand your vision. Our designers will take it from there.',
              icon: (
                <svg
                  className="h-6 w-6 sm:h-8 sm:w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              ),
            },
            {
              step: 3,
              title: 'Review & Print',
              desc: 'Approve designs in 24h and watch your production move to delivery.',
              icon: (
                <svg
                  className="h-6 w-6 sm:h-8 sm:w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="relative mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white sm:mb-4 sm:h-16 sm:w-16 sm:text-2xl">
                {item.step}
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
              </div>
              <h3 className="mb-2 text-base font-semibold text-white sm:text-xl">{item.title}</h3>
              <p className="mx-auto max-w-xs text-xs text-gray-400 sm:text-sm md:text-base">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/20 to-purple-600/20 p-6 text-center sm:rounded-2xl sm:p-8 md:p-12">
        <h2 className="mb-3 text-2xl font-bold text-white sm:mb-4 sm:text-3xl">
          Ready to Start Your Project?
        </h2>
        <p className="mx-auto mb-4 max-w-2xl text-sm text-gray-300 sm:mb-6 sm:text-base">
          Join thousands of businesses that trust us with their printing needs. Get started today
          and bring your ideas to life.
        </p>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <Link href="/collections/all/products">
            <Button variant="primary" size="md">
              Browse All Products
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link href="/auth/sign-up">
              <Button variant="outline" size="md">
                Create Account
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SEOHead {...METADATA.collections} />
      {isAuthenticated ? (
        <DashboardLayout userRole="customer">{MainContent}</DashboardLayout>
      ) : (
        <PublicLayout>{MainContent}</PublicLayout>
      )}
    </>
  );
}
