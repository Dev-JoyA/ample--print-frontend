# Backend Integration Guide

This guide describes how the frontend is integrated with the AMPLE Print Hub backend API.

**How to test:** See **[INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md)** for a step-by-step guide to testing all integration flows (auth, collections, products, orders, design, feedback, customer briefs) in order.

## Implemented Integration (Current)

- **API base:** `src/lib/api.js` – reusable client (`get`, `post`, `put`, `patch`, `delete`, `upload`) using `NEXT_PUBLIC_API_URL` (must include `/api/v1`).
- **Constants:** `src/lib/constants.js` – `API_PATHS`, `COOKIE_NAMES`, `API_DEFAULTS` aligned with backend routes.
- **Services:** `src/services/` – domain modules that use the API client:
  - `authService.js` – sign-in, sign-up, admin/superadmin flows, forgot/effect-forgot-password, refresh token, logout.
  - `userService.js` – get all, get by id, address, update profile, delete, role, activeness.
  - `collectionService.js` – list, get by id, all products, create/update/delete collection, create product.
  - `productService.js` – list, get by id, filter, search by name, update, delete.
  - `orderService.js` – create, my orders, get/update/delete, status, superadmin create, list, filter, needing-invoice, search.
  - `designService.js` – upload, update, delete, approve, get by id/user/order/product, all, filter.
  - `attachmentService.js` – get download URL for attachments.
  - `feedbackService.js` – create, my feedback, pending, get by id, respond, update status, by order, delete.
  - `customerBriefService.js` – submit/update brief, my briefs, admin respond, admin briefs, by order/product, by id, status, filter, delete.
- **Auth:** Token and refresh token are stored in **cookies** (`token`, `refreshToken`). `src/app/lib/auth.js` provides `protectRoute`, `useAuthCheck`, `refreshToken`, `setAuthCookies`. Middleware uses `NEXT_PUBLIC_API_URL` for token verification.

## Environment Variables

Create `.env.local` (see `.env.example`):

```env
# Backend base URL including /api/v1 (match backend PORT, e.g. 4001 or 8000)
NEXT_PUBLIC_API_URL=http://localhost:4001/api/v1
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## API Base and Client

The client in `src/lib/api.js` reads the token from cookies (client-side) and sends it as `Authorization: Bearer <token>`. All service methods use this client. For server-side (e.g. middleware), the app uses `NEXT_PUBLIC_API_URL` and passes the token from request cookies.

## Backend Path Reference (for custom usage)

Backend base is `/api/v1`. Main paths:

- **Auth:** `/auth/sign-in`, `/auth/sign-up`, `/auth/refresh-token`, `/auth/verify-token`, `/auth/forgot-password`, `/auth/effect-forgot-password`, `/auth/logout`, `/auth/admin-sign-up`, `/auth/superadmin-sign-up`, `/auth/deactivate-admin`, `/auth/reactivate-admin`, `/auth/reset-password/:userId`, etc.
- **Users:** `/users`, `/users/:userId`, `/users/:userId/address`, `/users/:userId/profile`, PATCH `/users/:userId/role`, PATCH `/users/:userId/activeness`.
- **Collections:** `/collections`, `/collections/:id`, `/collections/:collectionId/all-products`, POST `/collections/:collectionId/products`.
- **Products:** `/products`, `/products/:id`, `/products/filter`, `/products/search/by-name`.
- **Orders:** `/orders/create`, `/orders/my-orders`, `/orders/:id`, PATCH `/orders/:id/status`, `/orders/filter`, `/orders/needing-invoice`, `/orders/search/:orderNumber`, POST `/orders/super-admin/create/:customerId`.
- **Design:** `/design/orders/:productId`, `/design/update/:designId`, `/design/delete/:designId`, PUT `/design/:designId/approve`, `/design/:designId`, `/design/users/:userId`, `/design/orders/:orderId`, `/design/products/:productId`, `/design/all`, `/design/filter`.
- **Attachments:** `/attachments/download/:filename`.
- **Feedback:** `/feedback`, `/feedback/user`, `/feedback/pending`, `/feedback/:feedbackId`, `/feedback/:feedbackId/respond`, PATCH `/feedback/:feedbackId/status`, `/feedback/order/:orderId`.
- **Customer briefs:** `/customer-briefs/customer/orders/:orderId/products/:productId/brief`, `/customer-briefs/customer/briefs`, `/customer-briefs/admin/orders/:orderId/products/:productId/respond`, `/customer-briefs/admin/briefs`, `/customer-briefs/briefs/orders/:orderId/products/:productId`, `/customer-briefs/briefs/:briefId`, `/customer-briefs/briefs/status/:orderId/:productId`, `/customer-briefs/briefs/filter`.

Full API docs: run the backend and open `/api-docs` (Swagger).

## Example: Using Services in Pages

### Authentication (sign-in)

```javascript
import { authService } from '@/services/authService';
import { setAuthCookies } from '@/app/lib/auth';

const result = await authService.signIn(email, password);
setAuthCookies(result.token ?? result.accessToken, result.refreshToken);
router.push('/dashboard');
```

### Collections and products

```javascript
import { collectionService, productService } from '@/services';

const { data: collections } = await collectionService.getList({ page: 1, limit: 10 });
const product = await productService.getById(productId);
```

### Orders

```javascript
import { orderService } from '@/services';

const myOrders = await orderService.getMyOrders();
await orderService.create({ ...orderData });
```

### Design upload (multipart)

```javascript
import { designService } from '@/services';

const formData = new FormData();
formData.append('file', file);
await designService.upload(productId, formData);
```

## Legacy / Reference Section (pre-implementation)

The following was the original suggested pattern; the app now uses the implemented `src/lib/api.js`, `src/lib/constants.js`, and `src/services/*` above.

### Authentication (reference – use authService instead)

```javascript
// Use authService from @/services/authService
// login -> authService.signIn(email, password)
// register -> authService.signUp(userData)
// logout -> authService.logout(refreshToken) and clear cookies
// Token is in cookies; verify via /auth/verify-token (see app/lib/auth.js)
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
