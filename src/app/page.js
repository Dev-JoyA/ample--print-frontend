import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Footer from '@/components/ui/Footer';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';

export default function Home() {
  return (
    <>
      <SEOHead {...METADATA.home} />
      <div className="min-h-screen bg-slate-950 text-[#FFFFFF] font-inter overflow-x-hidden">
        <header className="sticky top-0 z-50 bg-slate-950 border-b border-dark-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img className="w-12 h-12 sm:w-17 sm:h-17" src="/images/logo/logo.png" alt="Ample Print Hub Logo" />
            </div>
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              <Link href="/" className="font-[600] text-gray-400 hover:text-white transition-colors">Home</Link>
              <Link href="/collections" className="font-[600] text-gray-400 hover:text-white transition-colors">Collections</Link>
              <Link href="/how-it-works" className="font-[600] text-gray-400 hover:text-white transition-colors">How It Works</Link>
              <Link href="/testimonials" className="font-[600] text-gray-400 hover:text-white transition-colors">Testimonials</Link>
              <Link href="/contact" className="font-[600] text-gray-400 hover:text-white transition-colors">Contact</Link>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/auth/sign-in">
                <Button variant="secondary" size="sm">Login</Button>
              </Link>
              <Link href="/new-order">
                <Button variant="primary" size="sm">Explore Studio</Button>
              </Link>
            </div>
          </div>
        </header>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12 md:py-[4rem]">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold mb-4">
                Professional Printing Services
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
                Where your <span className="text-primary">visions</span> find their physical <span className="text-primary">edge.</span>
              </h1>
              <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8">
                From business cards to large format banners, we deliver exceptional printing services with fast turnaround times and competitive pricing.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-2 text-gray-300 text-sm sm:text-base">
                  <span className="text-primary">✓</span>
                  <span>Fast turnaround times</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm sm:text-base">
                  <span className="text-primary">✓</span>
                  <span>Competitive pricing</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm sm:text-base">
                  <span className="text-primary">✓</span>
                  <span>Premium quality materials</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm sm:text-base">
                  <span className="text-primary">✓</span>
                  <span>Expert design support</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm">
                <Link href="/new-order">
                  <Button className='py-5' variant="primary" size="sm" icon="→" iconPosition="right">
                    Start Your First Order
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 border-2 border-dark"></div>
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm">Trusted by 2,000+ businesses globally</span>
                </div>
              </div>
            </div>
            <div className="relative mt-8 md:mt-0">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-3 sm:space-y-4">
                  <div className="rounded-lg p-1 aspect-square">
                    <img className="w-full h-full object-cover rounded-lg" src="/images/dummy-images/image 4.png" alt="Sample Print" />
                  </div>
                  <div className="rounded-lg p-1 aspect-square">
                    <img className="w-full h-full object-cover rounded-lg" src="/images/dummy-images/image 3.png" alt="Sample Print" />
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-8">
                  <div className="rounded-lg p-1 aspect-square">
                    <img className="w-full h-full object-cover rounded-lg" src="/images/dummy-images/image 1.png" alt="Sample Print" />
                  </div>
                  <div className="rounded-lg p-1 aspect-square -translate-y-8 sm:-translate-y-12 md:-translate-y-20">
                    <img className="w-full h-full object-cover rounded-lg" src="/images/dummy-images/image 2.png" alt="Sample Print" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 left-0 inline-flex items-center gap-1 px-2 bg-slate-900/80 rounded-lg py-1">
                <span className="text-primary text-sm sm:text-base">⚡</span>
                <span className="text-gray-300 text-[10px] sm:text-xs">Fast Delivery<br />2-5 business days</span>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 py-12 sm:py-16 md:py-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Print Solutions</h2>
              <p className="text-gray-400 text-sm sm:text-base">Curated tiers designed for operational efficiency and high emotional impact.</p>
            </div>
            <Link href="/collections">
              <Button variant="click">View Full Marketplace</Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { name: 'BRAND ESSENTIALS', desc: 'Foundational print materials every business needs to look professional.', image: '/images/dummy-images/bg-1.png' },
              { name: 'MARKETING & PAPER', desc: 'High-impact paper prints designed to promote, inform, and convert.', image: '/images/dummy-images/bg-2.jpg' },
              { name: 'PACKAGING & CARRY', desc: 'Custom packaging that elevates your product presentation.', image: '/images/dummy-images/bg-3.jpg' },
              { name: 'LARGE FORMAT', desc: 'Bold, oversized prints designed for maximum dominance.', image: '/images/dummy-images/bg-4.jpg' },
              { name: 'BOOKS & PUBLISHING', desc: 'Multi-page solutions for education and corporate storytelling.', image: '/images/dummy-images/bg-5.jpg' },
              { name: 'BRANDED MERCHANDISE', desc: 'Promotional products that extend your brand beyond paper.', image: '/images/dummy-images/bg-6.jpg' },
            ].map((solution, idx) => (
              <div key={idx} className="rounded-lg p-4 border border-gray-700 hover:border-primary/50 transition-all min-h-[280px] sm:min-h-[320px] bg-cover bg-center" style={{ backgroundImage: `url(${solution.image})` }}>
                <div className="flex justify-end mb-4">
                  <span className="text-[10px] text-white bg-zinc-950 border border-gray-500 rounded-md px-2 py-1">4-10 Days</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mt-auto pt-20 sm:pt-24 md:pt-28">{solution.name}</h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-4">{solution.desc}</p>
                <Button variant="explore" size="sm" icon="→" iconPosition="right">
                  Explore Tier
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-slate-800/50 rounded-2xl my-8 mx-4 sm:mx-6 lg:mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">How It Works</h2>
            <p className="text-gray-400 text-sm sm:text-base">Simple, straightforward process from order to delivery.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8 sm:my-12">
            {[
              { step: 1, title: 'Upload/Browse Your Design', desc: 'Upload your files or use our design templates to get started quickly.' },
              { step: 2, title: 'Review & Approve', desc: 'Our team prepares a proof for your review and approval before printing.' },
              { step: 3, title: 'We Print', desc: 'Your order is printed using premium materials and quality equipment.' },
              { step: 4, title: 'Fast Delivery', desc: 'Receive your order within 2-5 business days with tracking.' },
            ].map((item) => (
              <div key={item.step} className="rounded-lg p-4 sm:p-6 text-center relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gray-950 border border-rose-600 rounded-full flex items-center justify-center text-rose-600 text-[10px] font-bold z-10">
                  {item.step}
                </div>
                <div className="mt-4 mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-xl sm:text-2xl">↑</span>
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">What Our Customers Say</h2>
            <p className="text-gray-400 text-sm sm:text-base">Don't just take our word for it - hear from our satisfied customers.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { name: 'Madeleine Nkiru', company: 'Startup Hub', text: 'Fast turnaround, competitive pricing, and excellent quality. PrintPro is our go-to printing partner for all marketing materials.' },
              { name: 'Mathew Kamsguy', company: 'Event Masters LLC', text: "We've used PrintPro for multiple events and they never disappoint. The banners are durable and vibrant. Great customer support tool!" },
              { name: 'Joy Aruku', company: 'Marketing Pro Agency', text: 'Outstanding quality and service! PrintPro delivered our business cards ahead of schedule and they look absolutely professional. Highly recommended!' },
            ].map((testimonial, idx) => (
              <div key={idx} className="rounded-lg p-4 sm:p-6 border border-dark-lighter">
                <div className="flex gap-1 mb-3 sm:mb-4 text-sm sm:text-base">
                  {'⭐'.repeat(5)}
                </div>
                <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20"></div>
                  <div>
                    <p className="text-white font-semibold text-sm sm:text-base">{testimonial.name}</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="bg-red-900 rounded-xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Ready to Elevate Your Print?</h2>
            <p className="text-white/90 text-base sm:text-lg mb-6 sm:mb-8">Join thousands of satisfied customers and experience professional printing services today.</p>
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