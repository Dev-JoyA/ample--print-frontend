// const getBaseUrl = () => {
//   if (typeof window !== 'undefined') {
//     return window.location.origin;
//   }
//   return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';
// };

// export const getImageUrl = (imagePath) => {
//   if (!imagePath) return null;

//   if (imagePath.startsWith('http')) {
//     if (imagePath.includes('localhost:4001') && typeof window !== 'undefined') {
//       return imagePath.replace('http://localhost:4001', getBaseUrl());
//     }
//     return imagePath;
//   }

//   let filename = imagePath;
//   if (imagePath.includes('/')) {
//     filename = imagePath.split('/').pop();
//   }

//   const baseUrl = getBaseUrl();
//   return `${baseUrl}/api/images/${encodeURIComponent(filename)}`;
// };

// export const getDownloadUrl = (filePath) => {
//   if (!filePath) return null;

//   if (filePath.startsWith('http')) {
//     if (filePath.includes('localhost:4001') && typeof window !== 'undefined') {
//       return filePath.replace('http://localhost:4001', getBaseUrl());
//     }
//     return filePath;
//   }

//   let filename = filePath;
//   if (filePath.includes('/')) {
//     filename = filePath.split('/').pop();
//   }

//   const baseUrl = getBaseUrl();
//   const cleanBaseUrl = baseUrl.replace(/\/api\/v1$/, '');
//   return `${cleanBaseUrl}/api/download/${encodeURIComponent(filename)}`;
// };

// export const getAudioUrl = (audioPath) => {
//   if (!audioPath) return null;

//   if (audioPath.startsWith('http')) {
//     if (audioPath.includes('localhost:4001') && typeof window !== 'undefined') {
//       return audioPath.replace('http://localhost:4001', getBaseUrl());
//     }
//     return audioPath;
//   }

//   let filename = audioPath;
//   if (audioPath.includes('/')) {
//     filename = audioPath.split('/').pop();
//   }

//   const baseUrl = getBaseUrl();
//   return `${baseUrl}/api/images/${encodeURIComponent(filename)}`;
// };

// export const getReceiptUrl = (receiptPath) => {
//   if (!receiptPath) return null;

//   if (receiptPath.startsWith('http')) {
//     if (receiptPath.includes('localhost:4001') && typeof window !== 'undefined') {
//       return receiptPath.replace('http://localhost:4001', getBaseUrl());
//     }
//     return receiptPath;
//   }

//   let filename = receiptPath;
//   if (receiptPath.includes('/')) {
//     filename = receiptPath.split('/').pop();
//   }

//   const baseUrl = getBaseUrl();
//   return `${baseUrl}/api/receipts/${encodeURIComponent(filename)}`;
// };

// export const getProductImageUrl = (product) => {
//   if (!product) return '/images/placeholder.png';

//   const image = product.image || (product.images && product.images[0]);
//   if (!image) return '/images/placeholder.png';

//   return getImageUrl(image);
// };

// export const preloadImage = (src) => {
//   if (!src) return;
//   const img = document.createElement('img');
//   img.src = src;
// };

// const getBaseUrl = () => {
//   const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';
//   return apiUrl.replace(/\/api\/v1$/, '');
// };

// // export const getImageUrl = (imagePath) => {
// //   if (!imagePath) return null;
// //   if (imagePath.startsWith('http')) {
// //     return imagePath.replace('http://localhost:4001', getBaseUrl());
// //   }
// //   const filename = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
// //   return `${getBaseUrl()}/uploads/${encodeURIComponent(filename)}`;
// // };

// export const getImageUrl = (imagePath) => {
//   if (!imagePath) return null;
//   if (imagePath.startsWith('http')) return imagePath;
//   const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1').replace(
//     /\/api\/v1$/,
//     ''
//   );
//   return `${base}/uploads/${imagePath.split('/').pop()}`;
// };

// export const getDownloadUrl = (filePath) => {
//   if (!filePath) return null;
//   if (filePath.startsWith('http')) {
//     return filePath.replace('http://localhost:4001', getBaseUrl());
//   }
//   const filename = filePath.includes('/') ? filePath.split('/').pop() : filePath;
//   return `${getBaseUrl()}/uploads/${encodeURIComponent(filename)}`;
// };

// export const getAudioUrl = (audioPath) => {
//   if (!audioPath) return null;
//   if (audioPath.startsWith('http')) {
//     return audioPath.replace('http://localhost:4001', getBaseUrl());
//   }
//   const filename = audioPath.includes('/') ? audioPath.split('/').pop() : audioPath;
//   return `${getBaseUrl()}/uploads/${encodeURIComponent(filename)}`;
// };

// export const getReceiptUrl = (receiptPath) => {
//   if (!receiptPath) return null;
//   if (receiptPath.startsWith('http')) {
//     return receiptPath.replace('http://localhost:4001', getBaseUrl());
//   }
//   const filename = receiptPath.includes('/') ? receiptPath.split('/').pop() : receiptPath;
//   return `${getBaseUrl()}/uploads/receipts/${encodeURIComponent(filename)}`;
// };

// export const getProductImageUrl = (product) => {
//   if (!product) return '/images/placeholder.png';
//   const image = product.image || (product.images && product.images[0]);
//   if (!image) return '/images/placeholder.png';
//   return getImageUrl(image);
// };

// export const preloadImage = (src) => {
//   if (!src || typeof document === 'undefined') return;
//   const img = document.createElement('img');
//   img.src = src;
// };

// src/lib/imageUtils.js

const getBase = () =>
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1').replace(/\/api\/v1$/, '');

// Detect if a string is a Cloudinary public ID (no extension, no slashes, not a URL)
const isCloudinaryId = (str) => {
  if (!str) return false;
  if (str.startsWith('http')) return false;
  // Cloudinary IDs typically: no dots (extension), no slashes, length > 15
  return !str.includes('.') && !str.includes('/') && str.length > 15;
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // Already a full URL (Cloudinary)
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Cloudinary public ID (old data without extension)
  if (isCloudinaryId(imagePath)) {
    return `${getBase()}/api/images/${encodeURIComponent(imagePath)}`;
  }

  // Local file - serve from uploads folder (ORIGINAL WORKING LOGIC)
  const filename = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
  return `${getBase()}/uploads/${encodeURIComponent(filename)}`;
};

export const getAudioUrl = (audioPath) => {
  if (!audioPath) return null;

  if (audioPath.startsWith('http')) {
    return audioPath;
  }

  if (isCloudinaryId(audioPath)) {
    return `${getBase()}/api/images/${encodeURIComponent(audioPath)}`;
  }

  const filename = audioPath.includes('/') ? audioPath.split('/').pop() : audioPath;
  return `${getBase()}/uploads/${encodeURIComponent(filename)}`;
};

export const getDownloadUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;

  const filename = filePath.includes('/') ? filePath.split('/').pop() : filePath;
  const base = getBase();
  return `${base}/uploads/${encodeURIComponent(filename)}`;
};

export const getReceiptUrl = (receiptPath) => {
  if (!receiptPath) return null;
  if (receiptPath.startsWith('http')) return receiptPath;

  const filename = receiptPath.includes('/') ? receiptPath.split('/').pop() : receiptPath;
  const base = getBase();
  return `${base}/uploads/receipts/${encodeURIComponent(filename)}`;
};

export const getProductImageUrl = (product) => {
  if (!product) return '/images/placeholder.png';

  const image = product.image || (product.images && product.images[0]);
  if (!image) return '/images/placeholder.png';

  return getImageUrl(image);
};

export const preloadImage = (src) => {
  if (!src || typeof document === 'undefined') return;
  const img = document.createElement('img');
  img.src = src;
};
