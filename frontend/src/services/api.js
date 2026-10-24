import axiosInstance, { API_BASE_URL } from "../api/axios";
import axios from "axios";

export const walletApi = {
  // ---- health & readiness ----
  readiness: async () => {
    try {
      // Direct raw request to avoid interceptor refresh loops
      const response = await axios.get(`${API_BASE_URL}/health`, {
        withCredentials: true,
        timeout: 4000,
      });

      const data = response.data;
      return {
        full: Boolean(data?.success),
        checks: data?.checks || null,
        message: data?.message || "WalletX backend is healthy",
        isOffline: false,
      };
    } catch (err) {
      const isOffline = !err.response || err.code === "ECONNABORTED" || err.code === "ERR_NETWORK";
      const checks = err.response?.data?.checks || null;
      return {
        full: false,
        checks,
        message: err.response?.data?.message || err.message,
        isOffline,
      };
    }
  },

  // ---- auth ----
  login: (payload) => axiosInstance.post("/auth/login", payload),
  register: (payload) => axiosInstance.post("/auth/register", payload),
  refresh: () => axiosInstance.post("/auth/refresh"),
  logout: () => axiosInstance.post("/auth/logout"),

  // ---- profile / recipients ----
  profile: () => axiosInstance.get("/users/me"),
  findRecipient: (phoneNumber) =>
    axiosInstance.post("/users/recipient", { phoneNumber }),

  // ---- wallet ----
  createWallet: () => axiosInstance.post("/wallet"),
  myWallet: () => axiosInstance.get("/wallet/me"),

  // ---- transfers ----
  transfer: (payload, idempotencyKey) =>
    axiosInstance.post("/transactions/transfer", payload, {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }),

  // ---- ledger / statement ----
  ledger: (params = {}) => axiosInstance.get("/ledger", { params }),
  ledgerPdfUrl: ({ fromDate, toDate } = {}) => {
    const query = new URLSearchParams();
    if (fromDate) query.set("fromDate", fromDate);
    if (toDate) query.set("toDate", toDate);
    const qs = query.toString();
    return `${API_BASE_URL}/ledger/pdf${qs ? `?${qs}` : ""}`;
  },

  // ---- wallet security (UPI PIN) ----
  pinStatus: () => axiosInstance.get("/wallet-security/pin-status"),
  setPin: (payload) => axiosInstance.post("/wallet-security/set-pin", payload),
  verifyPin: (upiPin) =>
    axiosInstance.post("/wallet-security/verify-pin", { upiPin }),

  // ---- notifications ----
  notifications: (params = {}) =>
    axiosInstance.get("/notifications", { params }),
  readNotification: (id) =>
    axiosInstance.patch(`/notifications/${id}/read`),
  readAllNotifications: () =>
    axiosInstance.patch("/notifications/read-all"),
  subscribePush: (subscription) =>
    axiosInstance.post("/notifications/push/subscribe", subscription),
};

export default walletApi;
