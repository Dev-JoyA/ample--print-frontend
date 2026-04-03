export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http')) return imagePath;
  
  let filename = imagePath;
  if (imagePath.includes('/')) {
    filename = imagePath.split('/').pop();
  }
  
  const baseUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1')
    : 'http://localhost:4001/api/v1';
  
  return `${baseUrl}/attachments/download/${filename}`;
};

export const getProductImageUrl = (product) => {
  if (!product) return '/images/placeholder.png';
  
  const image = product.image || (product.images && product.images[0]);
  if (!image) return '/images/placeholder.png';
  
  return getImageUrl(image);
};