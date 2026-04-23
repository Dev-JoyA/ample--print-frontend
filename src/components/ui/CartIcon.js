'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/app/lib/auth';

const CartIcon = () => {
  const { cartCount, loading } = useCart();
  const { user } = useAuth();

  if (user?.role !== 'Customer') return null;

  return (
    <Link href="/order-history" className="relative">
      <button
        className="relative rounded-lg p-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        aria-label="Shopping cart"
      >
        <svg
          className="h-5 w-5 sm:h-6 sm:w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>

        {!loading && cartCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </button>
    </Link>
  );
};

export default CartIcon;
