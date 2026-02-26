import { api } from "@/lib/api";
import { API_PATHS } from "@/lib/constants";

export const authService = {
  signUp: (data) =>
    api.post(API_PATHS.AUTH.SIGN_UP, {
      firstName: data.firstName,
      lastName: data.lastName,
      userName: data.userName,
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber,
      address: data.address,
    }),

  signIn: (email, password) =>
    api.post(API_PATHS.AUTH.SIGN_IN, { email, password }),

  adminSignUp: (data) =>
    api.post(API_PATHS.AUTH.ADMIN_SIGN_UP, {
      firstName: data.firstName,
      lastName: data.lastName,
      userName: data.userName,
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber,
    }),

  superAdminSignUp: (data) =>
    api.post(API_PATHS.AUTH.SUPERADMIN_SIGN_UP, {
      firstName: data.firstName,
      lastName: data.lastName,
      userName: data.userName,
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber,
    }),

  deactivateAdmin: (data) =>
    api.post(API_PATHS.AUTH.DEACTIVATE_ADMIN, data),

  reactivateAdmin: (data) =>
    api.post(API_PATHS.AUTH.REACTIVATE_ADMIN, data),

  forgotPassword: (email) =>
    api.post(API_PATHS.AUTH.FORGOT_PASSWORD, { email }),

  effectForgotPassword: (token, newPassword, confirmPassword) =>
    api.post(API_PATHS.AUTH.EFFECT_FORGOT_PASSWORD, {
      token,
      newPassword,
      confirmPassword,
    }),

  resetPassword: (userId, data) =>
    api.post(API_PATHS.AUTH.RESET_PASSWORD(userId), data),

  logout: (refreshToken) =>
    api.post(API_PATHS.AUTH.LOGOUT, { refreshToken }),

  refreshToken: (refreshToken) =>
    api.post(API_PATHS.AUTH.REFRESH_TOKEN, { refreshToken }),

  verifyToken: (token) =>
    api.get(API_PATHS.AUTH.VERIFY_TOKEN, token ? { token } : {}),

  verifyRefreshToken: (token) =>
    api.get(API_PATHS.AUTH.VERIFY_REFRESH_TOKEN, token ? { token } : {}),

  generateRefreshToken: () =>
    api.post(API_PATHS.AUTH.GENERATE_REFRESH_TOKEN),
};
