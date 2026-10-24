import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Avoid infinite loop during silent token refresh
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

function onRefreshFailed(err) {
  refreshSubscribers.forEach((cb) => cb(err));
  refreshSubscribers = [];
}

const isAuthRoute = (url = "") =>
  url.includes("/auth/login") ||
  url.includes("/auth/register") ||
  url.includes("/auth/refresh") ||
  url.includes("/auth/logout");

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Return parsed data directly for cleaner consumption
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Attempt silent token refresh on any 401 from a protected endpoint.
    // This covers both "Access token expired" (mid-session) and
    // "Authentication required" / "Invalid access token" (startup, cookie missing
    // or access-token cookie cleared while refresh cookie is still valid).
    const is401 =
      error.response?.status === 401;

    if (
      is401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute(originalRequest.url)
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            { withCredentials: true, timeout: 5000 }
          );

          isRefreshing = false;
          onRefreshed();
          return axiosInstance(originalRequest);
        } catch (refreshErr) {
          isRefreshing = false;
          onRefreshFailed(refreshErr);
          // If refresh fails, fall through to user-friendly error
        }
      } else {
        // Wait for the ongoing refresh to finish
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((refreshErr) => {
            if (refreshErr) {
              reject(normalizeError(error));
            } else {
              resolve(axiosInstance(originalRequest));
            }
          });
        });
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

/**
 * Normalizes Axios errors into clean, user-friendly errors
 */
function normalizeError(error) {
  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      const err = new Error("Request timed out. Please try again.");
      err.code = "TIMEOUT";
      err.isNetworkError = true;
      return err;
    }

    const err = new Error(
      "Unable to connect to the WalletX server. Please check your connection."
    );
    err.code = "NETWORK_ERROR";
    err.isNetworkError = true;
    return err;
  }

  const status = error.response.status;
  const backendMessage = error.response.data?.message;

  let message = backendMessage;

  if (!message) {
    switch (status) {
      case 400:
        message = "Invalid request. Please check your inputs.";
        break;
      case 401:
        message = "Authentication required. Please log in.";
        break;
      case 403:
        message = "Access denied. Your account may be inactive.";
        break;
      case 404:
        message = "Requested resource not found.";
        break;
      case 409:
        message = "Conflict occurred or resource already exists.";
        break;
      case 422:
        message = "Validation error. Please verify your details.";
        break;
      case 423:
        message = "UPI PIN is temporarily locked. Please try again later.";
        break;
      case 429:
        message = "Too many requests. Please slow down and try again.";
        break;
      case 500:
        message = "Server error occurred. Please try again later.";
        break;
      default:
        message = "Something went wrong. Please try again.";
    }
  }

  const err = new Error(message);
  err.status = status;
  err.data = error.response.data;
  err.isOperational = true;
  return err;
}

export default axiosInstance;
