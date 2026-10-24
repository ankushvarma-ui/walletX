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

const EMPTY_WALLET = { id: null, walletId: null, balance: null, currency: "INR", status: null };

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
      setUser(res?.user || null);
      if (res?.user) {
        await fetchWallet();
      } else {
        setWallet(EMPTY_WALLET);
      }
    } catch (err) {
      if (isSessionGone(err)) {
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
      setUser(res.user);
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
      // Clear client state regardless of whether the server request succeeded,
      // so stale cookies being rejected by the backend don't block the user.
      setUser(null);
      setWallet(EMPTY_WALLET);
    }
  }, []);

  // Startup session restoration.
  // Rules:
  //  - Run once on mount; cancel if the component unmounts before completion.
  //  - The Axios interceptor in axios.js will silently attempt a token refresh
  //    on any 401 before the promise here sees the error. Only if both the
  //    original request AND the refresh fail will we receive an error here.
  //  - A genuine 401/403 from the backend means the session cannot be restored.
  //  - Any network / server / timeout error must NOT clear the user — we keep
  //    loading=true briefly and then resolve loading without a redirect, so
  //    the user stays on whatever page they were on and can retry naturally.
  useEffect(() => {
    let active = true;

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
        const restoredUser = res?.user ?? null;
        setUser(restoredUser);
        if (restoredUser) {
          await fetchWallet();
        }
      })
      .catch((err) => {
        if (!active) return;
        if (isSessionGone(err)) {
          // Backend confirmed no valid session — safe to redirect to login.
          setUser(null);
          setWallet(EMPTY_WALLET);
        }
        // Transient error (network, 500, timeout): leave user as null but do
        // NOT actively redirect. ProtectedRoute will show the loading screen
        // briefly; the user stays on their page.
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
