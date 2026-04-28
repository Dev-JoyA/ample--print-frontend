'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onError,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (onError) onError();
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const placeholderImage = '/images/placeholder.png';

  if (fill) {
    return (
      <div className={`relative overflow-hidden bg-slate-800 ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        <Image
          src={hasError || !imgSrc ? placeholderImage : imgSrc}
          alt={alt || 'Image'}
          fill
          sizes={sizes}
          priority={priority}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onError={handleError}
          onLoad={handleLoad}
          quality={quality}
          {...props}
        />
      </div>
    );
  }

  const finalWidth = width || 100;
  const finalHeight = height || 100;

  return (
    <div
      className={`relative overflow-hidden bg-slate-800 ${className}`}
      style={{ width: finalWidth, height: finalHeight }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      )}
      <Image
        src={hasError || !imgSrc ? placeholderImage : imgSrc}
        alt={alt || 'Image'}
        width={finalWidth}
        height={finalHeight}
        priority={priority}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleError}
        onLoad={handleLoad}
        quality={quality}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
