import { COOKIE_NAMES } from "./constants";

const API_BASE_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1"
    : "http://localhost:4001/api/v1";

console.log("🔧 API Base URL:", API_BASE_URL);

function getToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAMES.TOKEN}=`));
  const token = match ? decodeURIComponent(match.split("=")[1]) : null;
  console.log("🔑 Token from cookie:", token ? "Present" : "Not found");
  return token;
}

// Add back the getRefreshToken function
function getRefreshToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAMES.REFRESH_TOKEN}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function buildHeaders(customHeaders = {}, options = {}) {
  const token = options.token ?? getToken();
  const headers = {
    ...customHeaders,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log("📨 Request headers:", { ...headers, Authorization: 'Bearer [HIDDEN]' });
  }
  return headers;
}

async function handleResponse(response) {
  console.log(`📡 Response from ${response.url}: Status ${response.status}`);
  
  const contentType = response.headers.get("content-type");
  const isJson =
    contentType && contentType.toLowerCase().includes("application/json");
  const data = isJson ? await response.json().catch(() => ({})) : await response.text();
  
  console.log("📦 Response data:", data);
  
  if (!response.ok) {
    const err = new Error(data?.message || data?.error || `HTTP ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Reusable API client. Use from client components only (token from cookie).
 * For server-side (middleware, server actions) use fetch with API_BASE_URL and pass token.
 */
export const api = {
  getBaseUrl: () => API_BASE_URL,

  get: async (endpoint, options = {}) => {
    console.log(`🚀 GET Request to: ${API_BASE_URL}${endpoint}`);
    const headers = buildHeaders({ "Content-Type": "application/json" }, options);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers,
      credentials: "include",
      ...options.fetchOpts,
    });
    return handleResponse(response);
  },

  post: async (endpoint, data, options = {}) => {
    console.log(`🚀 POST Request to: ${API_BASE_URL}${endpoint}`);
    console.log("📤 Request data:", data);
    
    const isFormData = data instanceof FormData;
    const headers = buildHeaders(
      isFormData ? {} : { "Content-Type": "application/json" },
      options
    );
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      credentials: "include",
      body: isFormData ? data : JSON.stringify(data ?? {}),
      ...options.fetchOpts,
    });
    return handleResponse(response);
  },

  put: async (endpoint, data, options = {}) => {
    console.log(`🚀 PUT Request to: ${API_BASE_URL}${endpoint}`);
    console.log("📤 Request data:", data);
    
    const isFormData = data instanceof FormData;
    const headers = buildHeaders(
      isFormData ? {} : { "Content-Type": "application/json" },
      options
    );
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      credentials: "include",
      body: isFormData ? data : JSON.stringify(data ?? {}),
      ...options.fetchOpts,
    });
    return handleResponse(response);
  },

  patch: async (endpoint, data, options = {}) => {
    console.log(`🚀 PATCH Request to: ${API_BASE_URL}${endpoint}`);
    console.log("📤 Request data:", data);
    
    const headers = buildHeaders({ "Content-Type": "application/json" }, options);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      credentials: "include",
      body: JSON.stringify(data ?? {}),
      ...options.fetchOpts,
    });
    return handleResponse(response);
  },

  delete: async (endpoint, options = {}) => {
    console.log(`🚀 DELETE Request to: ${API_BASE_URL}${endpoint}`);
    
    const headers = buildHeaders({}, options);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
      credentials: "include",
      ...options.fetchOpts,
    });
    return handleResponse(response);
  },

  /**
   * Upload file(s) via FormData. endpoint and formData required.
   */
  upload: async (endpoint, formData, options = {}) => {
    console.log(`🚀 UPLOAD Request to: ${API_BASE_URL}${endpoint}`);
    
    const headers = buildHeaders({}, options);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
      ...options.fetchOpts,
    });
    return handleResponse(response);
  },
};

export { API_BASE_URL, getToken, getRefreshToken };