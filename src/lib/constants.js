/**
 * API path constants – aligned with backend routes (base: /api/v1).
 * Use with API_BASE_URL from env so full URL = API_BASE_URL + path.
 */
export const API_PATHS = {
  // Auth
  AUTH: {
    SIGN_UP: "/auth/sign-up",
    SIGN_IN: "/auth/sign-in",
    ADMIN_SIGN_UP: "/auth/admin-sign-up",
    SUPERADMIN_SIGN_UP: "/auth/superadmin-sign-up",
    DEACTIVATE_ADMIN: "/auth/deactivate-admin",
    REACTIVATE_ADMIN: "/auth/reactivate-admin",
    FORGOT_PASSWORD: "/auth/forgot-password",
    EFFECT_FORGOT_PASSWORD: "/auth/effect-forgot-password",
    RESET_PASSWORD: (userId) => `/auth/reset-password/${userId}`,
    LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh-token",
    VERIFY_TOKEN: "/auth/verify-token",
    VERIFY_REFRESH_TOKEN: "/auth/verify-refresh-token",
    GENERATE_REFRESH_TOKEN: "/auth/generate-refresh-token",
    GOOGLE: "/auth/google",
    GOOGLE_SUCCESS: "/auth/google/success",
    GOOGLE_FAILURE: "/auth/google/failure",
  },
  // Users
  USERS: {
    LIST: "/users",
    BY_ID: (userId) => `/users/${userId}`,
    ADDRESS: (userId) => `/users/${userId}/address`,
    PROFILE: (userId) => `/users/${userId}/profile`,
    ROLE: (userId) => `/users/${userId}/role`,
    ACTIVENESS: (userId) => `/users/${userId}/activeness`,
  },
  // Collections & products (productRoute mounted at /api/v1)
  COLLECTIONS: {
    LIST: "/collections",
    BY_ID: (id) => `/collections/${id}`,
    ALL_PRODUCTS: (collectionId) => `/collections/${collectionId}/all-products`,
    CREATE_PRODUCT: (collectionId) => `/collections/${collectionId}/products`,
  },
  PRODUCTS: {
    LIST: "/products",
    BY_ID: (id) => `/products/${id}`,
    FILTER: "/products/filter",
    SEARCH_BY_NAME: "/products/search/by-name",
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },
  // Attachments
  ATTACHMENTS: {
    DOWNLOAD: (filename) => `/attachments/download/${filename}`,
  },
  // Design
  DESIGN: {
    UPLOAD: (productId) => `/design/orders/${productId}`,
    UPDATE: (designId) => `/design/update/${designId}`,
    DELETE: (designId) => `/design/delete/${designId}`,
    APPROVE: (designId) => `/design/${designId}/approve`,
    BY_ID: (designId) => `/design/${designId}`,
    BY_USER: (userId) => `/design/users/${userId}`,
    BY_ORDER: (orderId) => `/design/orders/${orderId}`,
    BY_PRODUCT: (productId) => `/design/products/${productId}`,
    ALL: "/design/all",
    FILTER: "/design/filter",
  },
  // Orders
  ORDERS: {
    CREATE: "/orders/create",
    MY_ORDERS: "/orders/my-orders",
    BY_ID: (id) => `/orders/${id}`,
    STATUS: (id) => `/orders/${id}/status`,
    SUPERADMIN_CREATE: (customerId) => `/orders/super-admin/create/${customerId}`,
    LIST: "/orders",
    FILTER: "/orders/filter",
    NEEDING_INVOICE: "/orders/needing-invoice",
    SEARCH: (orderNumber) => `/orders/search/${orderNumber}`,
  },
  // Feedback (mounted at /api/v1)
  FEEDBACK: {
    CREATE: "/feedback",
    USER_LIST: "/feedback/user",
    PENDING: "/feedback/pending",
    BY_ID: (feedbackId) => `/feedback/${feedbackId}`,
    RESPOND: (feedbackId) => `/feedback/${feedbackId}/respond`,
    STATUS: (feedbackId) => `/feedback/${feedbackId}/status`,
    BY_ORDER: (orderId) => `/feedback/order/${orderId}`,
  },
  // Customer briefs (mounted at /api/v1/customer-briefs)
  CUSTOMER_BRIEFS: {
    SUBMIT: (orderId, productId) =>
      `/customer-briefs/customer/orders/${orderId}/products/${productId}/brief`,
    UPDATE: (orderId, productId) =>
      `/customer-briefs/customer/orders/${orderId}/products/${productId}/brief`,
    MY_BRIEFS: "/customer-briefs/customer/briefs",
    ADMIN_RESPOND: (orderId, productId) =>
      `/customer-briefs/admin/orders/${orderId}/products/${productId}/respond`,
    ADMIN_BRIEFS: "/customer-briefs/admin/briefs",
    BY_ORDER_PRODUCT: (orderId, productId) =>
      `/customer-briefs/briefs/orders/${orderId}/products/${productId}`,
    BY_ID: (briefId) => `/customer-briefs/briefs/${briefId}`,
    STATUS: (orderId, productId) =>
      `/customer-briefs/briefs/status/${orderId}/${productId}`,
    FILTER: "/customer-briefs/briefs/filter",
    DELETE: (briefId) => `/customer-briefs/briefs/${briefId}`,
  },
};

/** Cookie names used by the app */
export const COOKIE_NAMES = {
  TOKEN: "token",
  REFRESH_TOKEN: "refreshToken",
};

/** Default request timeouts / limits */
export const API_DEFAULTS = {
  PAGINATION_PAGE: 1,
  PAGINATION_LIMIT: 10,
};
