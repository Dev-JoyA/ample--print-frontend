import Image from 'next/image';
import Link from 'next/link';

const CollectionCard = ({ collection, onClick }) => {
  const { id, name, image, productCount } = collection;

  return (
    <div
      className="bg-dark-light rounded-lg overflow-hidden border border-dark-lighter hover:border-primary/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Collection Image */}
      <div className="relative w-full h-64 bg-dark overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        )}
      </div>

      {/* Collection Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors mb-1">
          {name}
        </h3>
        {productCount !== undefined && (
          <p className="text-sm text-gray-400">{productCount} products</p>
        )}
      </div>
    </div>
  );
};

export default CollectionCard;
