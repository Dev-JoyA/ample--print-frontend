// 'use client';

// import { useState, useCallback, useRef, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { orderService } from '@/services/orderService';

// const SearchBar = ({ placeholder = 'Search orders by number...', userRole = 'customer' }) => {
//   const router = useRouter();
//   const [query, setQuery] = useState('');
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showResults, setShowResults] = useState(false);
//   const searchRef = useRef(null);

//   if (userRole === 'customer') {
//     return (
//       <div className="my-3 ml-0 max-w-full flex-1 sm:ml-8 md:ml-12 lg:ml-16">
//         <div className="relative">
//           <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200">
//             <svg
//               className="h-4 w-4 sm:h-5 sm:w-5"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//               />
//             </svg>
//           </div>
//           <input
//             type="text"
//             placeholder="Track your order..."
//             className="w-full rounded-2xl border border-[#3a3a3a] bg-[#2a2a2a] px-3 py-2 pl-8 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary sm:w-64 sm:pl-10 sm:text-base"
//             onFocus={() => router.push('/order-tracking')}
//             readOnly
//           />
//         </div>
//       </div>
//     );
//   }

//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setShowResults(false);
//       }
//     }
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (query.length >= 3) {
//         searchOrders();
//       } else {
//         setResults([]);
//       }
//     }, 500);

//     return () => clearTimeout(timer);
//   }, [query]);

//   const searchOrders = async () => {
//     if (query.length < 3) return;

//     setLoading(true);
//     try {
//       let orders = [];

//       const isOrderNumber = query.toUpperCase().includes('ORD-');

//       if (isOrderNumber) {
//         try {
//           const response = await orderService.searchByOrderNumber(query.toUpperCase());
//           const orderData = response?.order || response?.data || response;
//           if (orderData) {
//             orders = [orderData];
//           }
//         } catch (err) {
//           console.log('Order not found by exact number');
//           try {
//             const filterResponse = await orderService.filter({
//               search: query.toUpperCase(),
//               limit: 10,
//             });
//             orders = filterResponse?.order || [];
//           } catch (filterErr) {
//             console.log('No orders found');
//           }
//         }
//       } else {
//         const response = await orderService.filter({
//           search: query,
//           limit: 10,
//         });
//         orders = response?.order || [];
//       }

//       setResults(orders);
//       setShowResults(true);
//     } catch (error) {
//       console.error('Search failed:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChange = (e) => {
//     const value = e.target.value.toUpperCase();
//     setQuery(value);
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && query.length >= 3) {
//       searchOrders();
//     }
//   };

//   const formatCurrency = (amount) => {
//     return `₦${amount?.toLocaleString() || '0'}`;
//   };

//   const getCustomerName = (order) => {
//     if (order.userId?.fullname) return order.userId.fullname;
//     if (order.userId?.email) return order.userId.email.split('@')[0];
//     return 'Customer';
//   };

//   const getStatusColor = (status) => {
//     const colors = {
//       Pending: 'text-yellow-400',
//       OrderReceived: 'text-blue-400',
//       FilesUploaded: 'text-purple-400',
//       AwaitingInvoice: 'text-orange-400',
//       InvoiceSent: 'text-red-400',
//       DesignUploaded: 'text-indigo-400',
//       UnderReview: 'text-yellow-400',
//       Approved: 'text-green-400',
//       InProduction: 'text-blue-400',
//       Completed: 'text-green-400',
//       Shipped: 'text-teal-400',
//       Delivered: 'text-green-400',
//       Cancelled: 'text-red-400',
//     };
//     return colors[status] || 'text-gray-400';
//   };

//   return (
//     <div ref={searchRef} className="relative my-3 max-w-full flex-1 sm:ml-8 md:ml-12 lg:ml-16">
//       <div className="relative">
//         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200">
//           {loading ? (
//             <svg
//               className="h-4 w-4 animate-spin sm:h-5 sm:w-5"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <circle
//                 className="opacity-25"
//                 cx="12"
//                 cy="12"
//                 r="10"
//                 stroke="currentColor"
//                 strokeWidth="4"
//                 fill="none"
//               />
//               <path
//                 className="opacity-75"
//                 fill="currentColor"
//                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//               />
//             </svg>
//           ) : (
//             <svg
//               className="h-4 w-4 sm:h-5 sm:w-5"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//               />
//             </svg>
//           )}
//         </div>
//         <input
//           type="text"
//           value={query}
//           onChange={handleChange}
//           onKeyDown={handleKeyDown}
//           onFocus={() => results.length > 0 && setShowResults(true)}
//           placeholder={placeholder}
//           className="w-full rounded-2xl border border-[#3a3a3a] bg-[#2a2a2a] px-3 py-2 pl-8 text-sm uppercase text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary sm:w-80 sm:pl-10 sm:text-base"
//         />
//       </div>

//       {showResults && results.length > 0 && (
//         <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-[#333333] bg-[#1e1e1e] shadow-2xl">
//           <div className="p-3 sm:p-4">
//             <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-white sm:mb-3 sm:text-sm">
//               <span>📦</span> Orders ({results.length})
//             </h3>
//             <div className="space-y-2 sm:space-y-3">
//               {results.map((order) => (
//                 <div key={order._id} className="overflow-hidden rounded-lg bg-[#2a2a2a]">
//                   <Link
//                     href={`/dashboards/${userRole === 'super-admin' ? 'super' : 'admin'}-dashboard/orders/${order._id}`}
//                   >
//                     <div className="cursor-pointer p-2 transition hover:bg-[#3a3a3a] sm:p-3">
//                       <div className="flex flex-wrap items-center justify-between gap-2">
//                         <div className="flex items-center gap-2 sm:gap-3">
//                           <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 sm:h-8 sm:w-8">
//                             <span className="text-sm sm:text-lg">📦</span>
//                           </div>
//                           <div>
//                             <p className="text-xs font-medium text-white sm:text-sm">
//                               {order.orderNumber}
//                             </p>
//                             <p className="text-[10px] text-gray-400 sm:text-xs">
//                               {getCustomerName(order)} • {order.items?.length} items
//                             </p>
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <p className="text-xs font-bold text-primary sm:text-sm">
//                             {formatCurrency(order.totalAmount)}
//                           </p>
//                           <span
//                             className={`text-[10px] ${getStatusColor(order.status)} sm:text-xs`}
//                           >
//                             {order.status}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {showResults && query.length >= 3 && results.length === 0 && !loading && (
//         <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-[#333333] bg-[#1e1e1e] p-6 text-center shadow-2xl sm:p-8">
//           <p className="text-xs text-gray-400 sm:text-sm">No orders found for "{query}"</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SearchBar;

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { orderService } from '@/services/orderService';

const SearchBar = ({ placeholder = 'Search orders by number...', userRole = 'customer' }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // Wrap searchOrders with useCallback to memoize it
  const searchOrders = useCallback(async () => {
    if (query.length < 3) return;

    setLoading(true);
    try {
      let orders = [];

      const isOrderNumber = query.toUpperCase().includes('ORD-');

      if (isOrderNumber) {
        try {
          const response = await orderService.searchByOrderNumber(query.toUpperCase());
          const orderData = response?.order || response?.data || response;
          if (orderData) {
            orders = [orderData];
          }
        } catch (err) {
          console.log('Order not found by exact number');
          try {
            const filterResponse = await orderService.filter({
              search: query.toUpperCase(),
              limit: 10,
            });
            orders = filterResponse?.order || [];
          } catch (filterErr) {
            console.log('No orders found');
          }
        }
      } else {
        const response = await orderService.filter({
          search: query,
          limit: 10,
        });
        orders = response?.order || [];
      }

      setResults(orders);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // ✅ ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURN
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        searchOrders();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, searchOrders]); // Added searchOrders as dependency

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase();
    setQuery(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.length >= 3) {
      searchOrders();
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const getCustomerName = (order) => {
    if (order.userId?.fullname) return order.userId.fullname;
    if (order.userId?.email) return order.userId.email.split('@')[0];
    return 'Customer';
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'text-yellow-400',
      OrderReceived: 'text-blue-400',
      FilesUploaded: 'text-purple-400',
      AwaitingInvoice: 'text-orange-400',
      InvoiceSent: 'text-red-400',
      DesignUploaded: 'text-indigo-400',
      UnderReview: 'text-yellow-400',
      Approved: 'text-green-400',
      InProduction: 'text-blue-400',
      Completed: 'text-green-400',
      Shipped: 'text-teal-400',
      Delivered: 'text-green-400',
      Cancelled: 'text-red-400',
    };
    return colors[status] || 'text-gray-400';
  };

  // ✅ CONDITIONAL RETURN AFTER ALL HOOKS
  if (userRole === 'customer') {
    return (
      <div className="my-3 ml-0 max-w-full flex-1 sm:ml-8 md:ml-12 lg:ml-16">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200">
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
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
            placeholder="Track your order..."
            className="w-full rounded-2xl border border-[#3a3a3a] bg-[#2a2a2a] px-3 py-2 pl-8 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary sm:w-64 sm:pl-10 sm:text-base"
            onFocus={() => router.push('/order-tracking')}
            readOnly
          />
        </div>
      </div>
    );
  }

  // ✅ RETURN FOR ADMIN/SUPER-ADMIN
  return (
    <div ref={searchRef} className="relative my-3 max-w-full flex-1 sm:ml-8 md:ml-12 lg:ml-16">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200">
          {loading ? (
            <svg
              className="h-4 w-4 animate-spin sm:h-5 sm:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
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
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-[#3a3a3a] bg-[#2a2a2a] px-3 py-2 pl-8 text-sm uppercase text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary sm:w-80 sm:pl-10 sm:text-base"
        />
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-[#333333] bg-[#1e1e1e] shadow-2xl">
          <div className="p-3 sm:p-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-white sm:mb-3 sm:text-sm">
              <span>📦</span> Orders ({results.length})
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {results.map((order) => (
                <div key={order._id} className="overflow-hidden rounded-lg bg-[#2a2a2a]">
                  <Link
                    href={`/dashboards/${userRole === 'super-admin' ? 'super' : 'admin'}-dashboard/orders/${order._id}`}
                  >
                    <div className="cursor-pointer p-2 transition hover:bg-[#3a3a3a] sm:p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 sm:h-8 sm:w-8">
                            <span className="text-sm sm:text-lg">📦</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white sm:text-sm">
                              {order.orderNumber}
                            </p>
                            <p className="text-[10px] text-gray-400 sm:text-xs">
                              {getCustomerName(order)} • {order.items?.length} items
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-primary sm:text-sm">
                            {formatCurrency(order.totalAmount)}
                          </p>
                          <span
                            className={`text-[10px] ${getStatusColor(order.status)} sm:text-xs`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showResults && query.length >= 3 && results.length === 0 && !loading && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-[#333333] bg-[#1e1e1e] p-6 text-center shadow-2xl sm:p-8">
          <p className="text-xs text-gray-400 sm:text-sm">No orders found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
