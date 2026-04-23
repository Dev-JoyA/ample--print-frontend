import Image from 'next/image';
import Link from 'next/link';

const CollectionCard = ({ collection, onClick }) => {
  const { id, name, image, productCount } = collection;

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-lg border border-dark-lighter bg-slate-950 transition-all hover:border-primary/50"
      onClick={onClick}
    >
      <div className="relative h-48 w-full overflow-hidden bg-slate-900 sm:h-56 md:h-64">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-500">
            <svg
              className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="mb-1 text-sm font-semibold text-gray-100 transition-colors group-hover:text-primary sm:text-base">
          {name}
        </h3>
        {productCount !== undefined && (
          <p className="text-xs text-gray-400 sm:text-sm">{productCount} products</p>
        )}
      </div>
    </div>
  );
};

export default CollectionCard;
