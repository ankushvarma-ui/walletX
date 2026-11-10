import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { walletApi } from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Determines whether an error from the Axios interceptor represents a genuine,
// unrecoverable auth failure — i.e. the backend confirmed the session is gone
// even after a silent refresh attempt. Any other error (network down, 500,
// timeout, Redis unavailable) must NOT be treated as an auth failure so that
// a temporary outage never causes an unnecessary logout.
function isSessionGone(err) {
  // No HTTP response → transient network / timeout issue; keep user logged in.
  if (!err || !err.status) return false;
  // 401 after the interceptor has already tried to refresh → session truly expired.
  // 403 → account deactivated by admin, session must end.
  return err.status === 401 || err.status === 403;
}

const EMPTY_WALLET = { id: null, walletId: null, balance: null, currency: "INR", status: null, createdAt: null };

/**
 * Normalize a raw backend user object to consistent camelCase.
 * The backend returns different shapes depending on whether the data
 * comes from the Redis cache (camelCase isActive, no phoneNumber) or
 * directly from PostgreSQL (snake_case: phone_number, is_active, created_at).
 * We always normalise to camelCase here so the UI never needs to know.
 */
function normalizeUser(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    phoneNumber: raw.phoneNumber ?? raw.phone_number ?? null,
    isActive: raw.isActive ?? raw.is_active ?? true,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(EMPTY_WALLET);

  // Prevent duplicate concurrent /users/me calls (e.g., two effects racing on mount).
  const profileInflight = useRef(null);

  const setWalletInfo = useCallback((patch) => {
    setWallet((prev) => ({ ...prev, ...patch }));
  }, []);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await walletApi.myWallet();
      if (res?.wallet) {
        setWalletInfo({
          id: res.wallet.id,
          walletId: res.wallet.walletId,
          balance: res.wallet.balance,
          currency: res.wallet.currency,
          status: res.wallet.status,
          createdAt: res.wallet.createdAt ?? null,
        });
      }
    } catch {
      // Wallet fetch is not critical — try to get last balance from ledger as fallback.
      walletApi
        .ledger({ limit: 1 })
        .then((lr) => {
          const entry = lr.data?.entries?.[0];
          if (entry && entry.balance !== undefined) {
            setWalletInfo({ balance: entry.balance });
          }
        })
        .catch(() => {});
    }
  }, [setWalletInfo]);

  // Re-validates the session against the backend and refreshes user state.
  // Callers (e.g. manual refresh) intentionally surface all errors.
  const refresh = useCallback(async () => {
    try {
      const res = await walletApi.profile();
      const normalized = normalizeUser(res?.user);
      setUser(normalized);
      if (normalized) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("walletx_has_session", "true");
          window.sessionStorage.setItem("walletx_session", "true");
        }
        await fetchWallet();
      } else {
        setWallet(EMPTY_WALLET);
      }
    } catch (err) {
      if (isSessionGone(err)) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("walletx_has_session");
          window.sessionStorage.removeItem("walletx_session");
        }
        setUser(null);
        setWallet(EMPTY_WALLET);
      }
      // Swallow transient errors — keep existing user in state.
    } finally {
      setLoading(false);
    }
  }, [fetchWallet]);

  const login = useCallback(
    async (credentials) => {
      // The login response already contains the verified user from the backend,
      // so we use it directly without an extra /users/me round-trip.
      const res = await walletApi.login(credentials);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("walletx_has_session", "true");
        window.sessionStorage.setItem("walletx_session", "true");
      }
      setUser(normalizeUser(res.user));
      await fetchWallet();
      return res;
    },
    [fetchWallet]
  );

  const register = useCallback(async (payload) => {
    const res = await walletApi.register(payload);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await walletApi.logout();
    } finally {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("walletx_has_session");
        window.sessionStorage.removeItem("walletx_session");
      }
      setUser(null);
      setWallet(EMPTY_WALLET);
    }
  }, []);

  // Startup session restoration.
  // Only attempts profile restore if a previous session was established.
  // For unauthenticated visitors, loading resolves immediately to false without 401 calls.
  useEffect(() => {
    let active = true;

    const hasSession =
      typeof window !== "undefined" &&
      (window.localStorage.getItem("walletx_has_session") === "true" ||
        window.sessionStorage.getItem("walletx_session") === "true");

    if (!hasSession) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Deduplicate concurrent calls — only one profile request should be in
    // flight at any given time.
    if (!profileInflight.current) {
      profileInflight.current = walletApi.profile().finally(() => {
        profileInflight.current = null;
      });
    }

    profileInflight.current
      .then(async (res) => {
        if (!active) return;
        const restoredUser = normalizeUser(res?.user ?? null);
        if (restoredUser && typeof window !== "undefined") {
          window.localStorage.setItem("walletx_has_session", "true");
          window.sessionStorage.setItem("walletx_session", "true");
        }
        setUser(restoredUser);
        if (restoredUser) {
          await fetchWallet();
        }
      })
      .catch((err) => {
        if (!active) return;
        if (isSessionGone(err)) {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("walletx_has_session");
            window.sessionStorage.removeItem("walletx_session");
          }
          setUser(null);
          setWallet(EMPTY_WALLET);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchWallet]); // fetchWallet is stable (useCallback with no deps that change)

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      isAuthenticated: Boolean(user),
      isUnauthenticated: !loading && !user,
      refresh,
      login,
      register,
      logout,
      wallet,
      setWalletInfo,
      fetchWallet,
    }),
    [user, loading, wallet, refresh, login, register, logout, setWalletInfo, fetchWallet]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
