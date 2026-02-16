'use client';

import SearchBar from './SearchBar';
import Image from 'next/image';

const Header = ({ onSearch, showSearch = true }) => {
  return (
    <header className="sticky top-0 z-40 bg-dark border-b border-dark-light">
      <div className="flex items-center justify-between px-6 py-4">
        {showSearch && (
          <SearchBar onSearch={onSearch} />
        )}
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications */}
          <button className="p-2 text-gray-300 hover:text-white hover:bg-dark-light rounded-lg transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>

          {/* Shopping Cart */}
          <button className="p-2 text-gray-300 hover:text-white hover:bg-dark-light rounded-lg transition-colors relative">
            <svg
              className="w-6 h-6"
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
            <span className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-full text-xs flex items-center justify-center text-white">
              0
            </span>
          </button>

          {/* User Profile */}
          <div className="w-10 h-10 rounded-full bg-primary overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-light transition-all">
            <Image
              src="/images/logo/logo.png"
              alt="User"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
