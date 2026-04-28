import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatusBadge from '../ui/StatusBadge';

const ProductCard = ({ product, onClick }) => {
  const {
    _id,
    name,
    description,
    price,
    image,
    images,
    dimension,
    minOrder,
    deliveryDay,
    material,
    status,
    collectionId,
  } = product;

  const [imgError, setImgError] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const primaryImage = image || (images && images[0]) || null;

    if (primaryImage) {
      let filename = primaryImage;
      if (primaryImage.includes('/')) {
        filename = primaryImage.split('/').pop();
      }

      const url = `/api/images/${encodeURIComponent(filename)}`;
      setImageUrl(url);
    }
  }, [image, images]);

  const formatDeliveryTime = (deliveryString) => {
    if (!deliveryString) return '4-10 Days';
    const days = deliveryString.substring(0, 3);
    return `${days} Days`;
  };

  const formatDimensions = () => {
    if (dimension?.width && dimension?.height) {
      return `${dimension.width} x ${dimension.height}`;
    }
    return null;
  };

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-lg border border-dark-lighter bg-slate-950 transition-all hover:border-primary/50"
      onClick={onClick}
    >
      <div className="relative h-48 w-full overflow-hidden bg-slate-900 sm:h-56 md:h-64">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => {
              console.log('Image failed to load:', imageUrl);
              setImgError(true);
            }}
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
        <div className="flex items-center gap-1 text-xs text-gray-300 sm:gap-2">
          <svg
            className="h-3 w-3 sm:h-4 sm:w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs">{formatDeliveryTime(deliveryDay)}</span>
        </div>

        <h3 className="text-base font-semibold text-white transition-colors group-hover:text-primary sm:text-lg">
          {name}
        </h3>

        <p className="line-clamp-2 text-xs text-gray-400 sm:text-sm">
          {description || 'No description available'}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold text-gray-300 sm:gap-4 sm:pt-2">
          <span>MOQ {minOrder || 1} Units</span>
          {formatDimensions() && <span>FORMAT {formatDimensions()}</span>}
        </div>

        <div className="flex items-center justify-between border-t border-dark-lighter pt-2">
          <div>
            <p className="text-xs font-bold text-red-600">STARTING AT</p>
            <p className="text-base font-bold text-white sm:text-lg">
              ₦{price?.toLocaleString() || '0.00'}
            </p>
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-dark transition-colors hover:bg-primary sm:h-10 sm:w-10">
            <svg
              className="h-4 w-4 text-gray-400 group-hover:text-white sm:h-5 sm:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
