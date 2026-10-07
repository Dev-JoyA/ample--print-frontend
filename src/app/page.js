'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import Button from '@/components/ui/Button';
import Footer from '@/components/ui/Footer';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { collectionService } from '@/services/collectionService';

const FALLBACK_COLLECTIONS = [
  {
    name: 'BRAND ESSENTIALS',
    desc: 'Foundational print materials every business needs to look professional.',
    image: '/images/dummy-images/bg-1.png',
  },
  {
    name: 'MARKETING & PAPER',
    desc: 'High-impact paper prints designed to promote, inform, and convert.',
    image: '/images/dummy-images/bg-2.jpg',
  },
  {
    name: 'PACKAGING & CARRY',
    desc: 'Custom packaging that elevates your product presentation.',
    image: '/images/dummy-images/bg-3.jpg',
  },
  {
    name: 'LARGE FORMAT',
    desc: 'Bold, oversized prints designed for maximum dominance.',
    image: '/images/dummy-images/bg-4.jpg',
  },
  {
    name: 'BOOKS & PUBLISHING',
    desc: 'Multi-page solutions for education and corporate storytelling.',
    image: '/images/dummy-images/bg-5.jpg',
  },
  {
    name: 'BRANDED MERCHANDISE',
    desc: 'Promotional products that extend your brand beyond paper.',
    image: '/images/dummy-images/bg-6.jpg',
  },
];

const NAV_ITEMS = [
  { label: 'Home', href: '#home', section: 'home' },
  { label: 'Collections', href: '/collections', section: 'collections-page' },
  { label: 'How It Works', href: '#how-it-works', section: 'how-it-works' },
  { label: 'Testimonials', href: '#testimonials', section: 'testimonials' },
  { label: 'Contact', href: '#contact', section: 'contact' },
];

function getCollectionList(response) {
  const payload = response?.data?.data ?? response?.data ?? response ?? [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.collections)) return payload.collections;
  if (Array.isArray(payload?.results)) return payload.results;

  return [];
}

function mapCollection(collection, index) {
  const fallback = FALLBACK_COLLECTIONS[index % FALLBACK_COLLECTIONS.length];

  return {
    id: collection?._id ?? collection?.id ?? index,
    name: String(
      collection?.name ??
        collection?.title ??
        collection?.collectionName ??
        fallback.name
    ).toUpperCase(),
    desc:
      collection?.description ??
      collection?.desc ??
      collection?.summary ??
      fallback.desc,
    image:
      collection?.image ??
      collection?.imageUrl ??
      collection?.coverImage ??
      collection?.coverImageUrl ??
      collection?.thumbnail ??
      fallback.image,
    turnaround:
      collection?.turnaroundTime ??
      collection?.deliveryTime ??
      collection?.estimatedDelivery ??
      '4-10 Days',
  };
}

export default function Home() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState('home');
  const [collections, setCollections] = useState(FALLBACK_COLLECTIONS);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCollections = async () => {
      try {
        const response = await collectionService.getAll({
          page: 1,
          limit: 6,
        });

        const availableCollections = getCollectionList(response)
          .slice(0, 6)
          .map(mapCollection);

        if (mounted && availableCollections.length > 0) {
          setCollections(availableCollections);
        }
      } catch (error) {
        console.error('Failed to load collections:', error);
      } finally {
        if (mounted) {
          setCollectionsLoading(false);
        }
      }
    };

    loadCollections();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection('');
      return;
    }

    const sections = ['home', 'how-it-works', 'testimonials', 'contact']
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleSections[0]) {
          setActiveSection(visibleSections[0].target.id);
        }
      },
      {
        rootMargin: '-25% 0px -60% 0px',
        threshold: [0.1, 0.25, 0.5],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [pathname]);

  const isActive = (section) => {
    if (section === 'collections-page') {
      return pathname === '/collections';
    }

    return pathname === '/' && activeSection === section;
  };

  return (
    <>
      <SEOHead {...METADATA.home} />

      <div className="min-h-screen overflow-x-hidden bg-slate-950 font-inter text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-dark-light bg-slate-950/95 backdrop-blur">
          <div className="mx-auto flex h-[5rem] max-w-7xl items-center justify-between px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
           <Link
            href="/"
            className="flex h-full shrink-0 items-center"
            aria-label="Go to homepage"
            >
            <img
                className="h-full w-auto object-contain brightness-110 drop-shadow-md"
                src="/images/logo/logo.png"
                alt="Logo"
            />
            </Link>

            <nav className="hidden items-center gap-2 md:flex lg:gap-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`whitespace-nowrap px-2 py-2 text-xs font-semibold transition-colors lg:px-2.5 lg:text-sm ${
                    isActive(item.section)
                      ? 'text-red-600'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  aria-current={isActive(item.section) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/auth/sign-in">
                <Button variant="secondary" size="sm">
                  Login
                </Button>
              </Link>

              <Link href="/new-order">
                <Button variant="primary" size="sm">
                  Explore Studio
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section
          id="home"
          className="scroll-mt-20 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-10"
        >
          <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
            <div>
              <div className="mb-4 inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                Professional Printing Services
              </div>

              <h1 className="mb-4 text-2xl font-bold text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
                Where your <br /><span className="text-primary">visions</span> find
                <br />their physical <span className="text-primary">edge.</span>
              </h1>

              <p className="mb-6 text-base text-gray-400 sm:mb-8 sm:text-lg">
                From business cards to large format banners, we deliver
                exceptional printing services with fast turnaround times and
                competitive pricing.
              </p>

              <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4">
                {[
                  'Fast turnaround times',
                  'Competitive pricing',
                  'Premium quality materials',
                  'Expert design support',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm text-gray-300 sm:text-base"
                  >
                    <span className="text-primary">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-start gap-4 text-sm sm:flex-row sm:items-center">
                <Link href="/new-order">
                  <Button
                    className="py-5"
                    variant="primary"
                    size="sm"
                    icon="→"
                    iconPosition="right"
                  >
                    Start Your First Order
                  </Button>
                </Link>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full border-2 border-dark bg-primary/20 sm:h-8 sm:w-8"
                      />
                    ))}
                  </div>

                  <span className="text-xs sm:text-sm">
                    Trusted by 2,000+ businesses globally
                  </span>
                </div>
              </div>
            </div>

            <div className="relative mt-8 md:mt-0">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-3 sm:space-y-4">
                  <div className="aspect-square rounded-lg p-1">
                    <img
                      className="h-full w-full rounded-lg object-cover"
                      src="/images/dummy-images/image 4.png"
                      alt="Sample Print"
                    />
                  </div>

                  <div className="aspect-square rounded-lg p-1">
                    <img
                      className="h-full w-full rounded-lg object-cover"
                      src="/images/dummy-images/image 3.png"
                      alt="Sample Print"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 sm:space-y-4 sm:pt-8">
                  <div className="aspect-square rounded-lg p-1">
                    <img
                      className="h-full w-full rounded-lg object-cover"
                      src="/images/dummy-images/image 1.png"
                      alt="Sample Print"
                    />
                  </div>

                  <div className="aspect-square -translate-y-8 rounded-lg p-1 sm:-translate-y-12 md:-translate-y-20">
                    <img
                      className="h-full w-full rounded-lg object-cover"
                      src="/images/dummy-images/image 2.png"
                      alt="Sample Print"
                    />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 left-0 inline-flex items-center gap-1 rounded-lg bg-slate-900/80 px-2 py-1">
                <span className="text-sm text-primary sm:text-base">⚡</span>
                <span className="text-[10px] text-gray-300 sm:text-xs">
                  Fast Delivery
                  <br />
                  2-5 business days
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Available Collections */}
        <section
          id="collections"
          className="scroll-mt-20 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10"
        >
          <div className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                Available Collections
              </h2>
              <p className="text-sm text-gray-400 sm:text-base">
                Explore our latest print solutions and find the right fit for
                your business.
              </p>
            </div>

            <Link href="/collections">
              <Button variant="click">View All Collections</Button>
            </Link>
          </div>

          {collectionsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="min-h-[280px] animate-pulse rounded-lg border border-gray-800 bg-slate-900 sm:min-h-[320px]"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {collections.slice(0, 6).map((collection, idx) => (
                <div
                  key={collection.id ?? idx}
                  className="group relative min-h-[280px] overflow-hidden rounded-lg border border-gray-700 bg-cover bg-center p-4 transition-all hover:border-primary/50 sm:min-h-[320px]"
                  style={{ backgroundImage: `url("${collection.image}")` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="flex justify-end">
                      <span className="rounded-md border border-gray-500 bg-zinc-950 px-2 py-1 text-[10px] text-white">
                        {collection.turnaround}
                      </span>
                    </div>

                    <div className="mt-auto">
                      <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">
                        {collection.name}
                      </h3>

                      <p className="mb-4 text-xs text-gray-300 sm:text-sm">
                        {collection.desc}
                      </p>

                      <Link
                        href={`/collections${
                          collection.id ? `/${collection.id}` : ''
                        }`}
                      >
                        <Button
                          variant="explore"
                          size="sm"
                          icon="→"
                          iconPosition="right"
                        >
                          Explore Collection
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          className="scroll-mt-20 mx-auto my-8 max-w-7xl rounded-2xl bg-slate-800/50 px-4 py-12 sm:mx-6 sm:px-6 sm:py-16 md:py-20 lg:mx-auto lg:px-8"
        >
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              How It Works
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              Simple, straightforward process from order to delivery.
            </p>
          </div>

          <div className="my-8 grid gap-6 sm:my-12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: 1,
                title: 'Upload/Browse Your Design',
                desc: 'Upload your files or use our design templates to get started quickly.',
              },
              {
                step: 2,
                title: 'Review & Approve',
                desc: 'Our team prepares a proof for your review and approval before printing.',
              },
              {
                step: 3,
                title: 'We Print',
                desc: 'Your order is printed using premium materials and quality equipment.',
              },
              {
                step: 4,
                title: 'Fast Delivery',
                desc: 'Receive your order within 2-5 business days with tracking.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-lg p-4 text-center sm:p-6"
              >
                <div className="absolute -top-3 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 transform items-center justify-center rounded-full border border-rose-600 bg-gray-950 text-[10px] font-bold text-rose-600">
                  {item.step}
                </div>

                <div className="mb-4 mt-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600 sm:h-16 sm:w-16">
                    <span className="text-xl sm:text-2xl">↑</span>
                  </div>
                </div>

                <h3 className="mb-2 text-base font-semibold text-white sm:text-lg">
                  {item.title}
                </h3>

                <p className="text-xs text-gray-400 sm:text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section
          id="testimonials"
          className="scroll-mt-20 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8"
        >
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              What Our Customers Say
            </h2>

            <p className="text-sm text-gray-400 sm:text-base">
              Don&apos;t just take our word for it - hear from our satisfied
              customers.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {[
              {
                name: 'Madeleine Nkiru',
                company: 'Startup Hub',
                text: 'Fast turnaround, competitive pricing, and excellent quality. PrintPro is our go-to printing partner for all marketing materials.',
              },
              {
                name: 'Mathew Kamsguy',
                company: 'Event Masters LLC',
                text: "We've used PrintPro for multiple events and they never disappoint. The banners are durable and vibrant. Great customer support tool!",
              },
              {
                name: 'Joy Aruku',
                company: 'Marketing Pro Agency',
                text: 'Outstanding quality and service! PrintPro delivered our business cards ahead of schedule and they look absolutely professional. Highly recommended!',
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-lg border border-dark-lighter p-4 sm:p-6"
              >
                <div className="mb-3 flex gap-1 text-sm sm:mb-4 sm:text-base">
                  {'⭐'.repeat(5)}
                </div>

                <p className="mb-3 text-sm italic text-gray-300 sm:mb-4 sm:text-base">
                  &quot;{testimonial.text}&quot;
                </p>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 sm:h-10 sm:w-10" />

                  <div>
                    <p className="text-sm font-semibold text-white sm:text-base">
                      {testimonial.name}
                    </p>

                    <p className="text-xs text-gray-400 sm:text-sm">
                      {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section
          id="contact"
          className="scroll-mt-20 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8"
        >
          <div className="rounded-2xl bg-red-900 p-8 text-center sm:p-12">
            <h2 className="mb-3 text-2xl font-bold text-white sm:mb-4 sm:text-3xl md:text-4xl">
              Let&apos;s Bring Your Ideas to Life
            </h2>

            <p className="mx-auto mb-6 max-w-2xl text-base text-white/90 sm:mb-8 sm:text-lg">
              Need help choosing a collection, preparing your artwork, or
              placing an order? Our team is ready to help.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/new-order">
                <Button variant="secondary" size="lg" icon="→" iconPosition="right">
                  Get Started For Free
                </Button>
              </Link>

              <Link href="/collections">
                <Button variant="click" size="lg">
                  Browse Collections
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
