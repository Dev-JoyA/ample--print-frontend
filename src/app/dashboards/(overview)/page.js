'use client'

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
// import { FaUser, FaShoppingCart } from "react-icons/fa";

const collections = [
  { id: 1, name: "Bags", image: "/images/collections/bags.jpg" },
  { id: 2, name: "Nylons", image: "/images/collections/nylons.jpg" },
  { id: 3, name: "Branded Gift Items", image: "/images/collections/gifts.jpg" },
  { id: 4, name: "Stationery", image: "/images/collections/stationery.jpg" },
  { id: 5, name: "Apparel", image: "/images/collections/apparel.jpg" },
];

const Dashboard = () => {
  const [activeCollection, setActiveCollection] = useState(null);
  const [cart, setCart] = useState([]);
  const carouselRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll carousel
  useEffect(() => {
    if (!isPaused && carouselRef.current) {
      const interval = setInterval(() => {
        if (carouselRef.current) {
          carouselRef.current.scrollBy({ left: 200, behavior: "smooth" });
          // Reset scroll position if at the end
          if (
            carouselRef.current.scrollLeft + carouselRef.current.clientWidth >=
            carouselRef.current.scrollWidth
          ) {
            carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
          }
        }
      }, 3000); // Adjust scroll speed here

      return () => clearInterval(interval);
    }
  }, [isPaused]);

  const handleCollectionClick = (collection) => {
    setIsPaused(true); // Pause the carousel
    setActiveCollection(collection);
  };

  const handleAddToCart = (item) => {
    setCart([...cart, item]);
    alert(`${item.name} added to cart!`);
  };

  const handleGoBack = () => {
    setActiveCollection(null);
    setIsPaused(false); // Resume the carousel
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-blue-900">AMPLE PRINT HUB</h1>
          <div className="bg-yellow-200 p-2 rounded-lg">
            <p className="text-sm text-gray-700">🎉 New Promotion: 20% off on all bags!</p>
          </div>
        </div>
        {/* <div className="flex space-x-4">
          <FaUser className="text-2xl text-gray-700 cursor-pointer" />
          <div className="relative">
            <FaShoppingCart className="text-2xl text-gray-700 cursor-pointer" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2">
                {cart.length}
              </span>
            )}
          </div>
        </div> */}
      </header>

      {/* Main Content */}
      <main>
        {activeCollection ? (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <button
              onClick={handleGoBack}
              className="mb-4 text-blue-500 hover:underline"
            >
              &larr; Back to Collections
            </button>
            <h2 className="text-2xl font-bold mb-4">{activeCollection.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <Image
                    src={activeCollection.image}
                    alt={activeCollection.name}
                    width={300}
                    height={200}
                    className="rounded-lg"
                  />
                  <p className="mt-2 text-lg font-semibold">Item {item}</p>
                  <button
                    onClick={() =>
                      handleAddToCart({ name: `Item ${item} - ${activeCollection.name}` })
                    }
                    className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6">Our Collections</h2>
            <div
              ref={carouselRef}
              className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide"
              onMouseEnter={() => setIsPaused(true)} // Pause on hover
              onMouseLeave={() => setIsPaused(false)} // Resume on mouse leave
            >
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  onClick={() => handleCollectionClick(collection)}
                  className="flex-shrink-0 w-64 bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    width={200}
                    height={150}
                    className="rounded-lg"
                  />
                  <p className="mt-2 text-lg font-semibold text-center">
                    {collection.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;