# Backend Integration Guide

This guide provides instructions for integrating the frontend with your backend API.

## API Base Configuration

Create an API configuration file:

```javascript
// src/lib/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },
  
  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  put: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },
  
  upload: async (endpoint, formData) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
      body: formData,
    });
    return response.json();
  },
};

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## API Endpoints Integration

### Authentication

```javascript
// src/lib/auth.js
import { api } from './api';

export const auth = {
  login: async (email, password) => {
    return api.post('/auth/login', { email, password });
  },
  
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },
  
  logout: async () => {
    return api.post('/auth/logout');
  },
  
  getCurrentUser: async () => {
    return api.get('/auth/me');
  },
};
```

### Collections

```javascript
// src/lib/collections.js
import { api } from './api';

export const collections = {
  getAll: async () => {
    return api.get('/collections');
  },
  
  getById: async (id) => {
    return api.get(`/collections/${id}`);
  },
  
  getProducts: async (collectionId) => {
    return api.get(`/collections/${collectionId}/products`);
  },
};
```

### Products

```javascript
// src/lib/products.js
import { api } from './api';

export const products = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return api.get(`/products?${queryParams}`);
  },
  
  getById: async (id) => {
    return api.get(`/products/${id}`);
  },
  
  search: async (query) => {
    return api.get(`/products/search?q=${query}`);
  },
};
```

### Orders

```javascript
// src/lib/orders.js
import { api } from './api';

export const orders = {
  create: async (orderData) => {
    return api.post('/orders', orderData);
  },
  
  getAll: async () => {
    return api.get('/orders');
  },
  
  getById: async (id) => {
    return api.get(`/orders/${id}`);
  },
  
  track: async (orderNumber) => {
    return api.get(`/orders/track/${orderNumber}`);
  },
  
  updateStatus: async (id, status) => {
    return api.put(`/orders/${id}/status`, { status });
  },
};
```

### Customer Briefs

```javascript
// src/lib/customerBriefs.js
import { api } from './api';

export const customerBriefs = {
  create: async (orderId, briefData) => {
    return api.post(`/orders/${orderId}/brief`, briefData);
  },
  
  getByOrderId: async (orderId) => {
    return api.get(`/orders/${orderId}/brief`);
  },
  
  respond: async (briefId, response) => {
    return api.post(`/briefs/${briefId}/respond`, { response });
  },
  
  uploadAssets: async (briefId, files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('assets', file);
    });
    return api.upload(`/briefs/${briefId}/assets`, formData);
  },
};
```

### Payments

```javascript
// src/lib/payments.js
import { api } from './api';

export const payments = {
  initiatePaystack: async (orderId, amount) => {
    return api.post('/payments/paystack/initiate', { orderId, amount });
  },
  
  verifyPaystack: async (reference) => {
    return api.post('/payments/paystack/verify', { reference });
  },
  
  uploadReceipt: async (orderId, receiptFile) => {
    const formData = new FormData();
    formData.append('receipt', receiptFile);
    return api.upload(`/payments/${orderId}/receipt`, formData);
  },
  
  verifyBankTransfer: async (paymentId, verified) => {
    return api.put(`/payments/${paymentId}/verify`, { verified });
  },
};
```

### Shipping

```javascript
// src/lib/shipping.js
import { api } from './api';

export const shipping = {
  calculateCost: async (address) => {
    return api.post('/shipping/calculate', { address });
  },
  
  createShippingInvoice: async (orderId, shippingData) => {
    return api.post(`/orders/${orderId}/shipping`, shippingData);
  },
};
```

### Invoices

```javascript
// src/lib/invoices.js
import { api } from './api';

export const invoices = {
  create: async (orderId, invoiceData) => {
    return api.post(`/orders/${orderId}/invoice`, invoiceData);
  },
  
  getAll: async () => {
    return api.get('/invoices');
  },
  
  getById: async (id) => {
    return api.get(`/invoices/${id}`);
  },
  
  applyDiscount: async (invoiceId, discountCode) => {
    return api.put(`/invoices/${invoiceId}/discount`, { discountCode });
  },
  
  pay: async (invoiceId, paymentData) => {
    return api.post(`/invoices/${invoiceId}/pay`, paymentData);
  },
};
```

### Designs

```javascript
// src/lib/designs.js
import { api } from './api';

export const designs = {
  upload: async (orderId, designFiles) => {
    const formData = new FormData();
    designFiles.forEach((file) => {
      formData.append('designs', file);
    });
    return api.upload(`/orders/${orderId}/designs`, formData);
  },
  
  approve: async (designId) => {
    return api.put(`/designs/${designId}/approve`, { approved: true });
  },
  
  reject: async (designId, feedback) => {
    return api.put(`/designs/${designId}/approve`, { approved: false, feedback });
  },
};
```

### Discounts

```javascript
// src/lib/discounts.js
import { api } from './api';

export const discounts = {
  getAll: async () => {
    return api.get('/discounts');
  },
  
  create: async (discountData) => {
    return api.post('/discounts', discountData);
  },
  
  toggle: async (discountId, active) => {
    return api.put(`/discounts/${discountId}`, { active });
  },
};
```

## Example Page Integration

### Product Detail Page

```javascript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { products } from '@/lib/products';

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await products.getById(params.id);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    // Your component JSX
  );
}
```

### Order Creation

```javascript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { orders } from '@/lib/orders';
import { customerBriefs } from '@/lib/customerBriefs';

export default function CustomerBriefPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      // Create order
      const order = await orders.create({
        productId: formData.productId,
        quantity: formData.quantity,
      });

      // Create customer brief
      await customerBriefs.create(order.id, {
        designInstructions: formData.designInstructions,
        voiceBriefing: formData.voiceBriefing,
      });

      // Upload assets if any
      if (formData.assets.length > 0) {
        await customerBriefs.uploadAssets(order.id, formData.assets);
      }

      router.push(`/orders/summary?orderId=${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      // Show error message to user
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Your form JSX
  );
}
```

## Paystack Integration

Install Paystack SDK:

```bash
npm install react-paystack
```

```javascript
// src/lib/paystack.js
import { usePaystackPayment } from 'react-paystack';
import { payments } from './payments';

export const usePaystack = () => {
  const config = {
    reference: new Date().getTime().toString(),
    email: 'user@example.com', // Get from user context
    amount: 0, // Will be set dynamically
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  const handlePayment = async (orderId, amount) => {
    try {
      // Initiate payment on backend
      const { reference } = await payments.initiatePaystack(orderId, amount);
      
      initializePayment({
        ...config,
        amount: amount * 100, // Convert to kobo
        reference,
        onSuccess: async () => {
          // Verify payment
          await payments.verifyPaystack(reference);
          router.push('/payment/success');
        },
        onClose: () => {
          console.log('Payment closed');
        },
      });
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return { handlePayment };
};
```

## File Upload Integration

```javascript
// Example: Design Upload
const handleFileUpload = async (files) => {
  try {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.upload('/upload', formData);
    return response;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
```

## Error Handling

Create an error handler:

```javascript
// src/lib/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    switch (error.response.status) {
      case 401:
        // Unauthorized - redirect to login
        window.location.href = '/auth/sign-in';
        break;
      case 403:
        // Forbidden
        return 'You do not have permission to perform this action';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Server error. Please try again later';
      default:
        return error.response.data?.message || 'An error occurred';
    }
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection';
  } else {
    // Error setting up request
    return error.message || 'An unexpected error occurred';
  }
};
```

## Authentication Context

```javascript
// src/contexts/AuthContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/lib/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await auth.getCurrentUser();
        setUser(userData);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const { user, token } = await auth.login(email, password);
    localStorage.setItem('authToken', token);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await auth.logout();
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

## Next Steps

1. Update all page components to use API calls instead of mock data
2. Add loading states and error handling
3. Implement authentication checks
4. Add form validation
5. Implement real-time updates where needed
6. Add toast notifications for user feedback
7. Implement proper error boundaries

## Testing API Integration

1. Use tools like Postman to test backend endpoints
2. Check network tab in browser DevTools
3. Verify API responses match expected format
4. Test error scenarios
5. Verify authentication tokens are sent correctly
