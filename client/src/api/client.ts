import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

export const api = axios.create({
  baseURL,
});

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

/**
 * Automatically handle expired/invalid tokens (401) mid-session.
 * Clears the stored token and redirects to /login so the user can re-authenticate.
 * Skips the interceptor for auth routes (e.g. /auth/send-otp, /auth/verify-otp)
 * to avoid redirect loops during the login flow itself.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? "";
    const isAuthRoute = url.includes("/auth/");

    if (status === 401 && !isAuthRoute) {
      // Clear stale credentials
      localStorage.removeItem("zensos_token");
      localStorage.removeItem("zensos_seller");
      setApiToken(null);

      // Redirect to login if not already there
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
