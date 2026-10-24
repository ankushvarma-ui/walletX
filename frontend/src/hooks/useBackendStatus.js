import { useState, useEffect, useCallback, useRef } from "react";
import { walletApi } from "../services/api";

const RETRY_INTERVAL_MS = 3000;

export function useBackendStatus() {
  const [status, setStatus] = useState("checking"); // "checking" | "online" | "offline"
  const [checks, setChecks] = useState(null);
  const [message, setMessage] = useState("Connecting to WalletX server…");
  const isMounted = useRef(true);
  const timerRef = useRef(null);
  const checkHealthRef = useRef(null);

  const checkHealth = useCallback(async () => {
    if (!isMounted.current) return;
    setStatus((prev) => (prev === "offline" ? "checking" : prev));

    try {
      const res = await walletApi.readiness();
      if (!isMounted.current) return;

      setChecks(res.checks);

      if (res.full) {
        setStatus("online");
        setMessage("WalletX ready");
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else if (res.isOffline) {
        setStatus("offline");
        setMessage("We couldn't connect to the WalletX server.");
        // Schedule next retry
        timerRef.current = setTimeout(() => {
          checkHealthRef.current?.();
        }, RETRY_INTERVAL_MS);
      } else {
        // Server responded but services (db / redis) are starting up
        setStatus("checking");
        setMessage("Starting WalletX services…");
        timerRef.current = setTimeout(() => {
          checkHealthRef.current?.();
        }, RETRY_INTERVAL_MS);
      }
    } catch {
      if (!isMounted.current) return;
      setStatus("offline");
      setMessage("We couldn't connect to the WalletX server.");
      timerRef.current = setTimeout(() => {
        checkHealthRef.current?.();
      }, RETRY_INTERVAL_MS);
    }
  }, []);

  useEffect(() => {
    checkHealthRef.current = checkHealth;
  }, [checkHealth]);

  const retry = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    void checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    isMounted.current = true;
    void checkHealth();

    return () => {
      isMounted.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [checkHealth]);

  return {
    status,
    checks,
    message,
    retry,
    isOnline: status === "online",
    isOffline: status === "offline",
    isChecking: status === "checking",
  };
}

export default useBackendStatus;
