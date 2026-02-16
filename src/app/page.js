import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Footer from '@/components/ui/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark border-b border-dark-light">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <span className="text-white text-xl font-bold">Ample Print</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
            <Link href="/collections" className="text-gray-300 hover:text-white transition-colors">Collections</Link>
            <Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</Link>
            <Link href="/testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</Link>
            <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/sign-in">
              <Button variant="secondary" size="sm">Login</Button>
            </Link>
            <Link href="/new-order">
              <Button variant="primary" size="sm">Explore Studio</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold mb-4">
              CREATIVE PRINT MARKETPLACE
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Where your <span className="text-primary">visions</span> find their physical <span className="text-primary">edge.</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              From business cards to large format banners, we deliver exceptional printing services with fast turnaround times and competitive pricing.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-primary">✓</span>
                <span>Fast turnaround times</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-primary">✓</span>
                <span>Competitive pricing</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-primary">✓</span>
                <span>Premium quality materials</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-primary">✓</span>
                <span>Expert design support</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/new-order">
                <Button variant="primary" size="lg" icon="→" iconPosition="right">
                  Start Your First Order
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-dark"></div>
                  ))}
                </div>
                <span>Trusted by 2,000+ businesses globally</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-dark-light rounded-lg p-4 aspect-square">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg"></div>
              </div>
              <div className="bg-dark-light rounded-lg p-4 aspect-square">
                <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-lg"></div>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="bg-dark-light rounded-lg p-4 aspect-square">
                <div className="w-full h-full bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-lg"></div>
              </div>
              <div className="bg-dark-light rounded-lg p-4 aspect-square">
                <div className="w-full h-full bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 bg-dark-light rounded-lg p-4 inline-flex items-center gap-3">
          <span className="text-primary">⚡</span>
          <span className="text-gray-300">Fast Delivery 2-5 business days</span>
        </div>
      </section>

      {/* Print Solutions Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">Print Solutions</h2>
            <p className="text-gray-400">Curated tiers designed for operational efficiency and high emotional impact.</p>
          </div>
          <Link href="/collections">
            <Button variant="outline">View Full Marketplace</Button>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'BRAND ESSENTIALS', desc: 'Foundational print materials every business needs to look professional.', icon: '👔' },
            { name: 'MARKETING & PAPER', desc: 'High-impact paper prints designed to promote, inform, and convert.', icon: '📄' },
            { name: 'PACKAGING & CARRY', desc: 'Custom packaging that elevates your product presentation.', icon: '📦' },
            { name: 'LARGE FORMAT', desc: 'Bold, oversized prints designed for maximum dominance.', icon: '📊' },
            { name: 'BOOKS & PUBLISHING', desc: 'Multi-page solutions for education and corporate storytelling.', icon: '📚' },
            { name: 'BRANDED MERCHANDISE', desc: 'Promotional products that extend your brand beyond paper.', icon: '👕' },
          ].map((solution, idx) => (
            <div key={idx} className="bg-dark-light rounded-lg p-6 border border-dark-lighter hover:border-primary/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{solution.icon}</span>
                <span className="text-xs text-gray-500">4-10 Days</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{solution.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{solution.desc}</p>
              <Button variant="ghost" size="sm" icon="→" iconPosition="right">
              Explore Tier
            </Button>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">How It Works</h2>
          <p className="text-gray-400">Simple, straightforward process from order to delivery.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: 1, title: 'Upload/Browse Your Design', desc: 'Upload your files or use our design templates to get started quickly.' },
            { step: 2, title: 'Review & Approve', desc: 'Our team prepares a proof for your review and approval before printing.' },
            { step: 3, title: 'We Print', desc: 'Your order is printed using premium materials and quality equipment.' },
            { step: 4, title: 'Fast Delivery', desc: 'Receive your order within 2-5 business days with tracking.' },
          ].map((item) => (
            <div key={item.step} className="bg-dark-light rounded-lg p-6 border border-dark-lighter text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                {item.step}
              </div>
              <div className="mt-4 mb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">↑</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">What Our Customers Say</h2>
          <p className="text-gray-400">Don't just take our word for it - hear from our satisfied customers.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Madeleine Nkiru', company: 'Startup Hub', text: 'Fast turnaround, competitive pricing, and excellent quality. PrintPro is our go-to printing partner for all marketing materials.' },
            { name: 'Mathew Kamsguy', company: 'Event Masters LLC', text: 'We've used PrintPro for multiple events and they never disappoint. The banners are durable and vibrant. Great customer support tool!' },
            { name: 'Joy Aruku', company: 'Marketing Pro Agency', text: 'Outstanding quality and service! PrintPro delivered our business cards ahead of schedule and they look absolutely professional. Highly recommended!' },
          ].map((testimonial, idx) => (
            <div key={idx} className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
              <div className="flex gap-1 mb-4">
                {'⭐'.repeat(5)}
              </div>
              <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20"></div>
                <div>
                  <p className="text-white font-semibold">{testimonial.name}</p>
                  <p className="text-gray-400 text-sm">{testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-primary rounded-lg p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Elevate Your Print?</h2>
          <p className="text-white/90 text-lg mb-8">Join thousands of satisfied customers and experience professional printing services today.</p>
          <Link href="/new-order">
            <Button variant="secondary" size="lg" icon="→" iconPosition="right">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
