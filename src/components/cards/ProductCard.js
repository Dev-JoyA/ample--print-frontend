import Image from 'next/image';
import Link from 'next/link';
import StatusBadge from '../ui/StatusBadge';

const ProductCard = ({ product, onClick }) => {
  const {
    id,
    name,
    description,
    price,
    image,
    category,
    deliveryTime = '4-10 Days',
    moq = '250 Units',
    format,
  } = product;

  return (
    <div
      className="bg-slate-950 rounded-lg overflow-hidden border border-dark-lighter hover:border-primary/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Category Tag */}
      <div className="px-4 pt-4">
        <span className="text-[10px] px-3 py-1 font-medium bg-zinc-700 text-white border border-zinc-700 rounded-2xl uppercase">{category}</span>
      </div>

      {/* Product Image */}
      <div className="relative w-full h-48 bg-slate-900 overflow-hidden">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Delivery Time */}
        <div className="flex items-center gap-2 text-xs text-gray-300 ">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{deliveryTime}</span>
        </div>

        {/* Product Name */}
        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400 line-clamp-2 ">
          {description}
        </p>

        {/* Details */}
        <div className="flex items-center gap-4 text-xs font-bold text-gray-300 pt-2 border-t border-dark-lighter">
          <span>MOQ {moq}</span>
          {format && <span>FORMAT {format}</span>}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-dark-lighter">
          <div>
            <p className="text-xs text-red-600 font-bold">STARTING AT</p>
            <p className="text-lg font-bold text-white">₦{price?.toLocaleString() || '0.00'}</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-dark hover:bg-primary flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
