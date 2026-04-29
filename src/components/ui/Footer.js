import Link from 'next/link';
import WhatsAppButton from './WhatsAppButton';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-dark-lighter bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <img
                className="h-16 w-auto brightness-110 drop-shadow-md sm:h-24"
                src="/images/logo/logo.png"
                alt="Logo"
              />
            </div>
            <p className="mb-4 text-sm text-gray-400 sm:text-base">
              Your trusted partner for professional printing services. High-quality products, fast
              turnaround, and exceptional customer service.
            </p>
            <div className="space-y-1 text-xs text-gray-400 sm:space-y-2 sm:text-sm">
              <p>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=5+Boyle+Street+Somolu+Lagos+Nigeria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-blue-500 hover:underline"
                >
                  5, Boyle Street Somolu, Lagos, Nigeria
                </a>
              </p>
              <p>
                <a
                  href="tel:+2348142534202"
                  className="transition-colors hover:text-blue-500 hover:underline"
                >
                  +2348142534202
                </a>
              </p>
              <p>
                <a
                  href="mailto:amplePrintHub@gmail.com"
                  className="transition-colors hover:text-blue-500 hover:underline"
                >
                  amplePrintHub@gmail.com
                </a>
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white sm:mb-4 sm:text-base">Product</h3>
            <ul className="space-y-2 text-xs text-gray-400 sm:text-sm">
              <li>
                <Link
                  href="/collections/brand-essentials"
                  className="transition-colors hover:text-primary"
                >
                  Business Cards
                </Link>
              </li>
              <li>
                <Link
                  href="/collections/marketing"
                  className="transition-colors hover:text-primary"
                >
                  Flyers & Brochures
                </Link>
              </li>
              <li>
                <Link
                  href="/collections/large-format"
                  className="transition-colors hover:text-primary"
                >
                  Banners & Posters
                </Link>
              </li>
              <li>
                <Link href="/collections/stickers" className="transition-colors hover:text-primary">
                  Custom Stickers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white sm:mb-4 sm:text-base">Company</h3>
            <ul className="space-y-2 text-xs text-gray-400 sm:text-sm">
              <li>
                <Link href="/about" className="transition-colors hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="transition-colors hover:text-primary">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-primary">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t border-dark-lighter pt-6 sm:mt-8 sm:pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="mb-1 text-sm font-semibold text-white sm:text-base">
                Subscribe to our newsletter
              </h3>
              <p className="text-xs text-gray-400 sm:text-sm">
                Get updates on new products and special offers
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border border-dark-lighter bg-dark px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary sm:w-64 sm:px-4 sm:py-2"
              />
              <button className="rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-dark sm:px-6">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-dark-lighter pt-6 text-center text-xs text-gray-400 sm:mt-8 sm:flex-row sm:pt-8 sm:text-left sm:text-sm">
          <p>© 2025 Ampleprinthub. All rights reserved.</p>
          <div className="flex gap-4 sm:gap-6">
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              Terms of Service
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-primary">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
      <WhatsAppButton />
    </footer>
  );
};

export default Footer;
