import { COOKIE_NAMES } from "./constants";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";

function getToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAMES.TOKEN}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function buildHeaders(customHeaders = {}, options = {}) {
  const token = options.token ?? getToken();

  const headers = {
    ...customHeaders, // ⚠️ no default Content-Type here
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const err = new Error(
    (typeof data === "object" ? data?.message : data) || `HTTP ${response.status}`
    );
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: async (endpoint, options = {}) => {
    const headers = buildHeaders({}, options);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers,
      credentials: "include",
      ...options.fetchOpts,
    });
    return handleResponse(response);
  },

  post: async (endpoint, data, options = {}) => {
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
    const headers = buildHeaders(
      { "Content-Type": "application/json" },
      options
    );

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
    const headers = buildHeaders({}, options);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
      credentials: "include",
      ...options.fetchOpts,
    });
    return handleResponse(response);
  },

  upload: async (endpoint, formData, options = {}) => {
    const headers = buildHeaders({}, options); // ❌ no Content-Type
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
      ...options.fetchOpts,
    });
    return handleResponse(response);
  },

  getBlob: async (endpoint, options = {}) => {
  const token = getToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Authorization": token ? `Bearer ${token}` : "",
    },
    credentials: "include",
    ...options.fetchOpts,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();
    
    const err = new Error(
      (typeof data === "object" ? data?.message : data) || `HTTP ${response.status}`
    );
    err.status = response.status;
    throw err;
  }

  return response.blob();
},
};

export { API_BASE_URL, getToken };