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

const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  let filename = imagePath;
  if (imagePath.includes('/')) {
    filename = imagePath.split('/').pop();
  }

  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/images/${encodeURIComponent(filename)}`;
};

export const getDownloadUrl = (filePath) => {
  if (!filePath) return null;

  if (filePath.startsWith('http')) {
    return filePath;
  }

  let filename = filePath;
  if (filePath.includes('/')) {
    filename = filePath.split('/').pop();
  }

  const baseUrl = getApiBaseUrl();
  const cleanBaseUrl = baseUrl.replace(/\/api\/v1$/, '');
  return `${cleanBaseUrl}/download/${encodeURIComponent(filename)}`;
};

export const getAudioUrl = (audioPath) => {
  if (!audioPath) return null;

  if (audioPath.startsWith('http')) {
    return audioPath;
  }

  let filename = audioPath;
  if (audioPath.includes('/')) {
    filename = audioPath.split('/').pop();
  }

  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/images/${encodeURIComponent(filename)}`;
};

export const getReceiptUrl = (receiptPath) => {
  if (!receiptPath) return null;

  if (receiptPath.startsWith('http')) {
    return receiptPath;
  }

  let filename = receiptPath;
  if (receiptPath.includes('/')) {
    filename = receiptPath.split('/').pop();
  }

  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/receipts/${encodeURIComponent(filename)}`;
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
