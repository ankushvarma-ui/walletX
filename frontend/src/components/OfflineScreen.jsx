export default function OfflineScreen({ onRetry, isChecking }) {
  return (
    <main className="startup">
      <section className="startup-card">
        <div className="brand-mark">W</div>
        <p className="eyebrow">WALLETX</p>
        <h1 className="text-danger mb-3">Backend is offline</h1>

        <p className="text-muted mb-2">
          We couldn't connect to the WalletX server.
        </p>
        <p className="text-muted mb-4">
          Please make sure the backend is running and try again.
        </p>

        <div className="d-flex flex-column align-items-center gap-2">
          <button
            className="btn btn-primary px-4 py-2"
            onClick={onRetry}
            disabled={isChecking}
          >
            {isChecking ? "Checking connection…" : "Retry"}
          </button>
          <small className="text-muted mt-2">
            Automatically retrying in the background…
          </small>
        </div>
      </section>
    </main>
  );
}
