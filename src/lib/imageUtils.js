const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http')) {
    if (imagePath.includes('localhost:4001') && typeof window !== 'undefined') {
      return imagePath.replace('http://localhost:4001', getBaseUrl());
    }
    return imagePath;
  }
  
  let filename = imagePath;
  if (imagePath.includes('/')) {
    filename = imagePath.split('/').pop();
  }
  
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/images/${encodeURIComponent(filename)}`;
};

export const getReceiptUrl = (receiptPath) => {
  if (!receiptPath) return null;
  
  if (receiptPath.startsWith('http')) {
    if (receiptPath.includes('localhost:4001') && typeof window !== 'undefined') {
      return receiptPath.replace('http://localhost:4001', getBaseUrl());
    }
    return receiptPath;
  }
  
  let filename = receiptPath;
  if (receiptPath.includes('/')) {
    filename = receiptPath.split('/').pop();
  }
  
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/receipts/${encodeURIComponent(filename)}`;
};

export const getProductImageUrl = (product) => {
  if (!product) return '/images/placeholder.png';
  
  const image = product.image || (product.images && product.images[0]);
  if (!image) return '/images/placeholder.png';
  
  return getImageUrl(image);
};

export const preloadImage = (src) => {
  if (!src) return;
  const img = document.createElement('img');
  img.src = src;
};