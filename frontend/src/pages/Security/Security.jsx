import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { walletApi } from "../../services/api";

import Alert from "../../components/Alert";
import Field from "../../components/Field";
import Page from "../../components/Page";

import "./Security.css";

const emptySetupForm = {
  currentPassword: "",
  upiPin: "",
  confirmUpiPin: "",
};

export default function Security() {
  const { setWalletInfo } = useAuth();
  const { showToast } = useNotifications();

  const [pinSet, setPinSet] = useState(null);
  const [setupForm, setSetupForm] = useState(emptySetupForm);
  const [setupError, setSetupError] = useState("");
  const [setupSuccess, setSetupSuccess] = useState("");
  const [setupBusy, setSetupBusy] = useState(false);

  // Verification test tool state
  const [verifyPin, setVerifyPin] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");

  const fetchStatus = () => {
    walletApi
      .pinStatus()
      .then((res) => setPinSet(Boolean(res?.data?.pinSet)))
      .catch((err) => setSetupError(err.message));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSetPin = async (e) => {
    e.preventDefault();
    setSetupError("");
    setSetupSuccess("");

    if (!setupForm.currentPassword) {
      return setSetupError("Current account password is required.");
    }

    if (!/^\d{6}$/.test(setupForm.upiPin)) {
      return setSetupError("UPI PIN must be exactly 6 digits.");
    }

    if (setupForm.upiPin !== setupForm.confirmUpiPin) {
      return setSetupError("UPI PINs do not match.");
    }

    setSetupBusy(true);

    try {
      const res = await walletApi.setPin(setupForm);

      setSetupSuccess(res?.message || "UPI PIN created successfully.");
      setPinSet(true);
      setSetupForm(emptySetupForm);

      if (res?.data?.walletId) {
        setWalletInfo({ walletId: res.data.walletId });
      }

      showToast({
        variant: "success",
        title: "UPI PIN Created",
        message: "Your UPI PIN is set. You can now authorize transfers.",
      });
    } catch (err) {
      setSetupError(err.message || "Failed to set UPI PIN.");

      showToast({
        variant: "danger",
        title: "UPI PIN Setup Failed",
        message: err.message,
      });

      // Clear entered PINs on failure
      setSetupForm((prev) => ({ ...prev, upiPin: "", confirmUpiPin: "" }));
    } finally {
      setSetupBusy(false);
    }
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setVerifyError("");
    setVerifySuccess("");

    if (!/^\d{6}$/.test(verifyPin)) {
      return setVerifyError("Please enter a 6-digit UPI PIN to test.");
    }

    setVerifyBusy(true);

    try {
      const res = await walletApi.verifyPin(verifyPin);
      setVerifySuccess(res?.message || "UPI PIN verified successfully.");
      setVerifyPin("");
    } catch (err) {
      setVerifyError(err.message || "Incorrect UPI PIN.");
      setVerifyPin("");
    } finally {
      setVerifyBusy(false);
    }
  };

  return (
    <Page title="Security" subtitle="Manage and secure your WalletX account.">
      <section className="form-panel">
        <h2 className="mb-2">UPI PIN Status</h2>

        <div className="mb-4">
          {pinSet === null ? (
            <span className="text-muted small">Checking PIN configuration…</span>
          ) : pinSet ? (
            <div className="status-badge-card d-flex align-items-center gap-3 p-3 bg-light rounded border">
              <div className="shield-icon success">✓</div>
              <div>
                <strong className="d-block text-navy">UPI PIN Active</strong>
                <small className="text-muted">
                  Your wallet is authorized for outgoing transfers. Keep your PIN confidential.
                </small>
              </div>
            </div>
          ) : (
            <div className="status-badge-card d-flex align-items-center gap-3 p-3 bg-light rounded border">
              <div className="shield-icon warning">⚠</div>
              <div>
                <strong className="d-block text-navy">No UPI PIN Configured</strong>
                <small className="text-muted">
                  You must set a 6-digit PIN before you can send money from this wallet.
                </small>
              </div>
            </div>
          )}
        </div>

        {setupSuccess && (
          <div className="alert alert-success my-3">{setupSuccess}</div>
        )}

        {setupError && <Alert>{setupError}</Alert>}

        {/* Set PIN form if not set */}
        {!pinSet && (
          <form onSubmit={handleSetPin} autoComplete="off">
            <h3 className="h5 mb-3">Set Up 6-Digit UPI PIN</h3>
            <p className="text-muted small mb-4">
              Your UPI PIN is required to authorize all outgoing transfers. Never
              share it with anyone.
            </p>

            <Field
              label="Current account password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your account password"
              value={setupForm.currentPassword}
              onChange={(val) =>
                setSetupForm({ ...setupForm, currentPassword: val })
              }
            />

            <Field
              label="New 6-digit UPI PIN"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="new-password"
              placeholder="••••••"
              value={setupForm.upiPin}
              onChange={(val) =>
                setSetupForm({
                  ...setupForm,
                  upiPin: val.replace(/\D/g, "").slice(0, 6),
                })
              }
            />

            <Field
              label="Confirm 6-digit UPI PIN"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="new-password"
              placeholder="••••••"
              value={setupForm.confirmUpiPin}
              onChange={(val) =>
                setSetupForm({
                  ...setupForm,
                  confirmUpiPin: val.replace(/\D/g, "").slice(0, 6),
                })
              }
            />

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={setupBusy}
            >
              {setupBusy ? "Configuring UPI PIN…" : "Set UPI PIN"}
            </button>
          </form>
        )}

        {/* Verify PIN test panel when PIN is already configured */}
        {pinSet && (
          <div className="mt-4 pt-3 border-top">
            <h3 className="h5 mb-2">Test UPI PIN Verification</h3>
            <p className="text-muted small mb-3">
              Verify your PIN to ensure it's functioning properly. 3 consecutive
              incorrect attempts will lock your PIN for 15 minutes.
            </p>

            {verifySuccess && (
              <div className="alert alert-success py-2">{verifySuccess}</div>
            )}
            {verifyError && <Alert>{verifyError}</Alert>}

            <form onSubmit={handleVerifyPin} className="d-flex gap-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoComplete="off"
                placeholder="6-digit PIN"
                className="form-control"
                style={{ maxWidth: "200px" }}
                value={verifyPin}
                onChange={(e) =>
                  setVerifyPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
              <button
                type="submit"
                className="btn btn-outline-primary"
                disabled={verifyBusy || verifyPin.length !== 6}
              >
                {verifyBusy ? "Verifying…" : "Verify PIN"}
              </button>
            </form>
          </div>
        )}
      </section>
    </Page>
  );
}
