import { api } from "@/lib/api";
import { API_PATHS, API_DEFAULTS } from "@/lib/constants";

export const feedbackService = {
  create: (formData) => api.upload(API_PATHS.FEEDBACK.CREATE, formData),

  getMyFeedback: (params = {}) => {
    const { page = API_DEFAULTS.PAGINATION_PAGE, limit = API_DEFAULTS.PAGINATION_LIMIT } = params;
    const q = new URLSearchParams({ page, limit }).toString();
    return api.get(`${API_PATHS.FEEDBACK.USER_LIST}?${q}`);
  },

  getPending: (params = {}) => {
    const { page = API_DEFAULTS.PAGINATION_PAGE, limit = API_DEFAULTS.PAGINATION_LIMIT } = params;
    const q = new URLSearchParams({ page, limit }).toString();
    return api.get(`${API_PATHS.FEEDBACK.PENDING}?${q}`);
  },

  getById: (feedbackId) => api.get(API_PATHS.FEEDBACK.BY_ID(feedbackId)),

  respond: (feedbackId, response) =>
    api.post(API_PATHS.FEEDBACK.RESPOND(feedbackId), { response }),

  updateStatus: (feedbackId, status) =>
    api.patch(API_PATHS.FEEDBACK.STATUS(feedbackId), { status }),

  getByOrder: (orderId) => api.get(API_PATHS.FEEDBACK.BY_ORDER(orderId)),

  delete: (feedbackId) => api.delete(API_PATHS.FEEDBACK.BY_ID(feedbackId)),
};
