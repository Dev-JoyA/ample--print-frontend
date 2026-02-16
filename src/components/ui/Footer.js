import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-dark-lighter mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img className="w-17 h-17" src="/images/logo/logo.png" alt="Logo" />
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Your trusted partner for professional printing services. High-quality products, fast turnaround, and exceptional customer service.
            </p>
            <div className="space-y-2 text-gray-400 text-sm">
                <p>
                <a 
                    href="https://www.google.com/maps/search/?api=1&query=5+Boyle+Street+Somolu+Lagos+Nigeria" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-blue-500 hover:underline transition-colors"
                >
                    5, Boyle Street Somolu, Lagos, Nigeria
                </a>
                </p>

                <p>
                <a href="tel:+2348142534202" className="text-gray-300 hover:text-blue-500 hover:underline transition-colors">
                    +2348142534202
                </a>
                </p>

                <p>
                <a href="mailto:amplePrintHub@gmail.com" className="text-gray-300 hover:text-blue-500 hover:underline transition-colors">
                    amplePrintHub@gmail.com
                </a>
                </p>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/collections/brand-essentials" className="hover:text-primary transition-colors">
                  Business Cards
                </Link>
              </li>
              <li>
                <Link href="/collections/marketing" className="hover:text-primary transition-colors">
                  Flyers & Brochures
                </Link>
              </li>
              <li>
                <Link href="/collections/large-format" className="hover:text-primary transition-colors">
                  Banners & Posters
                </Link>
              </li>
              <li>
                <Link href="/collections/stickers" className="hover:text-primary transition-colors">
                  Custom Stickers
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-8 pt-8 border-t border-dark-lighter">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h3 className="text-white font-semibold mb-2">Subscribe to our newsletter</h3>
              <p className="text-gray-400 text-sm">Get updates on new products and special offers</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2 bg-dark border border-dark-lighter rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-dark-lighter flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <p>© 2025 Ampleprinthub. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-primary transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
