'use client';

const SearchBar = ({ placeholder = 'Search orders, invoices,...', onSearch }) => {
  return (
    <div className=" my-3 ml-[12rem] relative flex-1 max-w-2xl">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-200">
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        className="w-[20rem] pl-12 pr-4 py-2 bg-[#515151] border border-dark-lighter rounded-2xl text-white text-[14px] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        onChange={(e) => onSearch && onSearch(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
