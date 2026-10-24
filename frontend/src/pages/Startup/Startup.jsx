import { useEffect } from "react";
import useBackendStatus from "../../hooks/useBackendStatus";
import OfflineScreen from "../../components/OfflineScreen";
import "./Startup.css";

export default function Startup({ ready }) {
  const { checks, message, retry, isOnline, isOffline, isChecking } =
    useBackendStatus();

  useEffect(() => {
    if (isOnline) {
      // Proceed immediately when backend is healthy
      ready();
    }
  }, [isOnline, ready]);

  if (isOffline) {
    return <OfflineScreen onRetry={retry} isChecking={isChecking} />;
  }

  const getStatusIcon = (st) => {
    switch (st) {
      case "connected":
        return "✓";
      case "checking":
        return "⟳";
      case "disconnected":
        return "✗";
      default:
        return "•";
    }
  };

  const getStatusClass = (st) => {
    switch (st) {
      case "connected":
        return "status-ok";
      case "checking":
        return "status-checking";
      case "disconnected":
        return "status-error";
      default:
        return "status-unknown";
    }
  };

  return (
    <main className="startup">
      <section className="startup-card">
        <div className="brand-mark">W</div>
        <p className="eyebrow">WALLETX</p>
        <h1>Starting WalletX…</h1>

        <div className="spinner-container">
          <div className="spinner-ring" />
        </div>

        <p className="connecting-message">{message || "Connecting to server…"}</p>

        {checks && (
          <div className="health-checks">
            <div className="health-row">
              <span className={`status-icon ${getStatusClass(checks.server)}`}>
                {getStatusIcon(checks.server)}
              </span>
              <span>Application Server</span>
              <span className="status-badge success">Ready</span>
            </div>

            <div className="health-row">
              <span className={`status-icon ${getStatusClass(checks.database)}`}>
                {getStatusIcon(checks.database)}
              </span>
              <span>PostgreSQL Database</span>
              <span
                className={`status-badge ${
                  checks.database === "connected" ? "success" : "waiting"
                }`}
              >
                {checks.database === "connected" ? "Connected" : "Connecting…"}
              </span>
            </div>

            <div className="health-row">
              <span className={`status-icon ${getStatusClass(checks.cache)}`}>
                {getStatusIcon(checks.cache)}
              </span>
              <span>Redis Cache</span>
              <span
                className={`status-badge ${
                  checks.cache === "connected" ? "success" : "waiting"
                }`}
              >
                {checks.cache === "connected" ? "Connected" : "Connecting…"}
              </span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}