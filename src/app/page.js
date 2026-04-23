import Link from 'next/link';
import Button from '@/components/ui/Button';
import Footer from '@/components/ui/Footer';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';

export default function Home() {
  return (
    <>
      <SEOHead {...METADATA.home} />
      <div className="min-h-screen overflow-x-hidden bg-slate-950 font-inter text-[#FFFFFF]">
        <header className="sticky top-0 z-50 border-b border-dark-light bg-slate-950">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <img
                className="h-16 w-auto brightness-110 drop-shadow-md sm:h-24"
                src="/images/logo/logo.png"
                alt="Logo"
              />
            </div>
            <nav className="hidden items-center gap-4 md:flex lg:gap-6">
              <Link
                href="/"
                className="font-[600] text-gray-400 transition-colors hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/collections"
                className="font-[600] text-gray-400 transition-colors hover:text-white"
              >
                Collections
              </Link>
              <Link
                href="/how-it-works"
                className="font-[600] text-gray-400 transition-colors hover:text-white"
              >
                How It Works
              </Link>
              <Link
                href="/testimonials"
                className="font-[600] text-gray-400 transition-colors hover:text-white"
              >
                Testimonials
              </Link>
              <Link
                href="/contact"
                className="font-[600] text-gray-400 transition-colors hover:text-white"
              >
                Contact
              </Link>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
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

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-[4rem] lg:px-10">
          <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
            <div>
              <div className="mb-4 inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                Professional Printing Services
              </div>
              <h1 className="mb-4 text-3xl font-bold text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
                Where your <span className="text-primary">visions</span> find their physical{' '}
                <span className="text-primary">edge.</span>
              </h1>
              <p className="mb-6 text-base text-gray-400 sm:mb-8 sm:text-lg">
                From business cards to large format banners, we deliver exceptional printing
                services with fast turnaround times and competitive pricing.
              </p>
              <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-300 sm:text-base">
                  <span className="text-primary">✓</span>
                  <span>Fast turnaround times</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300 sm:text-base">
                  <span className="text-primary">✓</span>
                  <span>Competitive pricing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300 sm:text-base">
                  <span className="text-primary">✓</span>
                  <span>Premium quality materials</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300 sm:text-base">
                  <span className="text-primary">✓</span>
                  <span>Expert design support</span>
                </div>
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
                      ></div>
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm">Trusted by 2,000+ businesses globally</span>
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

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-20">
          <div className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                Print Solutions
              </h2>
              <p className="text-sm text-gray-400 sm:text-base">
                Curated tiers designed for operational efficiency and high emotional impact.
              </p>
            </div>
            <Link href="/collections">
              <Button variant="click">View Full Marketplace</Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {[
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
            ].map((solution, idx) => (
              <div
                key={idx}
                className="min-h-[280px] rounded-lg border border-gray-700 bg-cover bg-center p-4 transition-all hover:border-primary/50 sm:min-h-[320px]"
                style={{ backgroundImage: `url(${solution.image})` }}
              >
                <div className="mb-4 flex justify-end">
                  <span className="rounded-md border border-gray-500 bg-zinc-950 px-2 py-1 text-[10px] text-white">
                    4-10 Days
                  </span>
                </div>
                <h3 className="mt-auto pt-20 text-lg font-semibold text-white sm:pt-24 sm:text-xl md:pt-28">
                  {solution.name}
                </h3>
                <p className="mb-4 text-xs text-gray-400 sm:text-sm">{solution.desc}</p>
                <Button variant="explore" size="sm" icon="→" iconPosition="right">
                  Explore Tier
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-4 mx-auto my-8 max-w-7xl rounded-2xl bg-slate-800/50 px-4 py-12 sm:mx-6 sm:px-6 sm:py-16 md:py-20 lg:mx-auto lg:px-8">
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
              <div key={item.step} className="relative rounded-lg p-4 text-center sm:p-6">
                <div className="absolute -top-3 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 transform items-center justify-center rounded-full border border-rose-600 bg-gray-950 text-[10px] font-bold text-rose-600">
                  {item.step}
                </div>
                <div className="mb-4 mt-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600 sm:h-16 sm:w-16">
                    <span className="text-xl sm:text-2xl">↑</span>
                  </div>
                </div>
                <h3 className="mb-2 text-base font-semibold text-white sm:text-lg">{item.title}</h3>
                <p className="text-xs text-gray-400 sm:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              What Our Customers Say
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              Don't just take our word for it - hear from our satisfied customers.
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
            ].map((testimonial, idx) => (
              <div key={idx} className="rounded-lg border border-dark-lighter p-4 sm:p-6">
                <div className="mb-3 flex gap-1 text-sm sm:mb-4 sm:text-base">{'⭐'.repeat(5)}</div>
                <p className="mb-3 text-sm italic text-gray-300 sm:mb-4 sm:text-base">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 sm:h-10 sm:w-10"></div>
                  <div>
                    <p className="text-sm font-semibold text-white sm:text-base">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-400 sm:text-sm">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8">
          <div className="rounded-xl bg-red-900 p-8 text-center sm:p-12">
            <h2 className="mb-3 text-2xl font-bold text-white sm:mb-4 sm:text-3xl md:text-4xl">
              Ready to Elevate Your Print?
            </h2>
            <p className="mb-6 text-base text-white/90 sm:mb-8 sm:text-lg">
              Join thousands of satisfied customers and experience professional printing services
              today.
            </p>
            <Link href="/new-order">
              <Button variant="secondary" size="lg" icon="→" iconPosition="right">
                Get Started For Free
              </Button>
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
