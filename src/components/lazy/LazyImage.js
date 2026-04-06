'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';

const OptimizedImage = dynamic(() => import('@/components/ui/OptimizedImage'), {
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-800">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
    </div>
  ),
  ssr: false,
});

const LazyImage = ({ src, alt, width, height, fill = false, className = '', priority = false, ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {isVisible && (
        <OptimizedImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          priority={priority}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;