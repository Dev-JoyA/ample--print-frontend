'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ProductCard from '@/components/cards/ProductCard';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { METADATA, getCollectionMetadata } from '@/lib/metadata';
import { collectionService } from '@/services/collectionService';
import { productService } from '@/services/productService';

export default function ProductListPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id;

  const [currentCollection, setCurrentCollection] = useState(null);
  const [allCollections, setAllCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAllProducts, setIsAllProducts] = useState(collectionId === 'all');

  const [priceRange, setPriceRange] = useState([0, 500000]);

  useEffect(() => {
    fetchData();
  }, [collectionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const collectionsRes = await collectionService.getAll({ limit: 100 });
      let collectionsData = [];
      if (collectionsRes?.collections && Array.isArray(collectionsRes.collections)) {
        collectionsData = collectionsRes.collections;
      } else if (Array.isArray(collectionsRes)) {
        collectionsData = collectionsRes;
      } else if (collectionsRes?.data?.collections) {
        collectionsData = collectionsRes.data.collections;
      }
      setAllCollections(collectionsData);

      const isAll = collectionId === 'all';
      setIsAllProducts(isAll);

      if (isAll) {
        const productsRes = await productService.getList({ limit: 100 });
        console.log('All products response:', productsRes);
        
        let productsData = [];
        if (productsRes?.products && Array.isArray(productsRes.products)) {
          productsData = productsRes.products;
        } else if (Array.isArray(productsRes)) {
          productsData = productsRes;
        } else if (productsRes?.data && Array.isArray(productsRes.data)) {
          productsData = productsRes.data;
        }

        const formattedProducts = productsData.map(product => ({
          id: product._id,
          name: product.name,
          description: product.description || 'No description available',
          price: product.price || 0,
          category: 'ALL PRODUCTS',
          minOrder: product.minOrder || 1,
          dimension: product.dimension,
          image: product.image || product.images?.[0],
          images: product.images || [],
          deliveryDay: product.deliveryDay,
          collectionId: product.collectionId
        }));

        setProducts(formattedProducts);
        setCurrentCollection({ name: 'All Products' });
      } else {
        const collectionRes = await collectionService.getById(collectionId);
        setCurrentCollection(collectionRes?.collection || collectionRes?.data || null);

        const productsRes = await collectionService.getCollectionProducts(collectionId);
        
        let productsData = [];
        if (productsRes?.products && Array.isArray(productsRes.products)) {
          productsData = productsRes.products;
        } else if (Array.isArray(productsRes)) {
          productsData = productsRes;
        } else if (productsRes?.data && Array.isArray(productsRes.data)) {
          productsData = productsRes.data;
        }

        const formattedProducts = productsData.map(product => ({
          id: product._id,
          name: product.name,
          description: product.description || 'No description available',
          price: product.price || 0,
          category: currentCollection?.name?.toUpperCase() || 'COLLECTION',
          minOrder: product.minOrder || 1,
          dimension: product.dimension,
          image: product.image || product.images?.[0],
          images: product.images || [],
          deliveryDay: product.deliveryDay
        }));

        setProducts(formattedProducts);
      }

    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    let filename = imagePath;
    if (imagePath.includes('/')) {
      filename = imagePath.split('/').pop();
    }
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  };

  const filteredProducts = products.filter(product => 
    product.price >= priceRange[0] && product.price <= priceRange[1]
  );

  const pageTitle = isAllProducts ? 'All Products' : (currentCollection?.name || 'Products');
  const pageDescription = isAllProducts 
    ? 'Browse our complete collection of premium printing products'
    : `Explore our ${currentCollection?.name || ''} collection - high quality printing products for all your needs`;

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <SEOHead {...METADATA.products} title={pageTitle} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="mb-6 md:mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 md:mb-4 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Product Catalog</h1>
            <p className="text-gray-400 text-sm sm:text-base">Loading products...</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-slate-950 rounded-lg px-3 py-4">
                <div className="h-8 bg-slate-800 rounded mb-4 animate-pulse"></div>
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-10 bg-slate-800 rounded mb-2 animate-pulse"></div>
                ))}
              </div>
            </aside>

            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-slate-800 rounded-lg h-56 sm:h-64 animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="customer">
        <SEOHead {...METADATA.products} title={pageTitle} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="mb-6 md:mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 md:mb-4 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Product Catalog</h1>
            <p className="text-red-400 text-sm sm:text-base">{error}</p>
          </div>
          <Button onClick={fetchData} variant="primary" size="md">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <SEOHead 
        {...(isAllProducts ? METADATA.products : getCollectionMetadata({ name: currentCollection?.name }))}
        title={pageTitle}
        description={pageDescription}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => router.push('/collections')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 md:mb-4 transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Collections
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">{pageTitle}</h1>
          <p className="text-gray-400 text-sm sm:text-base">{products.length} products available</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-slate-950 rounded-lg px-3 py-4">
              <div>
                <h3 className="text-white font-bold text-sm sm:text-md mb-3 sm:mb-4">COLLECTIONS</h3>
                <div className="space-y-1">
                  <Link href="/collections/all/products">
                    <button
                      className={`w-full text-left font-semibold text-xs sm:text-sm px-3 py-2 sm:py-3 rounded-lg transition-colors ${
                        isAllProducts
                          ? 'bg-primary text-white'
                          : 'text-gray-400 hover:bg-dark hover:text-white'
                      }`}
                    >
                      All Products ({products.length})
                    </button>
                  </Link>

                  {allCollections.map((collection) => (
                    <Link
                      key={collection._id}
                      href={`/collections/${collection._id}/products`}
                    >
                      <button
                        className={`w-full text-left font-semibold text-xs sm:text-sm px-3 py-2 sm:py-3 rounded-lg transition-colors ${
                          !isAllProducts && collection._id === collectionId
                            ? 'bg-primary text-white'
                            : 'text-gray-400 hover:bg-dark hover:text-white'
                        }`}
                      >
                        {collection.name}
                      </button>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">PRICE RANGE</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="500000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs sm:text-sm text-gray-400">
                    <span>₦0</span>
                    <span>₦{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A1F29] rounded-lg p-3 sm:p-4 mt-6">
                <h4 className="text-white font-semibold text-sm sm:text-base mb-2">Can't find what you need?</h4>
                <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
                  We offer fully custom solutions for unique requirements.
                </p>
                <Button variant="outline" size="sm" className="w-full text-sm">
                  Custom Quote
                </Button>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-400 text-sm sm:text-base">No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => router.push(`/products/${product.id}`)}
                    className="cursor-pointer"
                  >
                    <ProductCard 
                      product={{
                        ...product,
                        image: getImageUrl(product.image)
                      }} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}