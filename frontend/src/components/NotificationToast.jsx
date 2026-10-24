import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { useNotifications } from "../context/NotificationContext";

const ICONS = {
  success: "✓",
  danger: "✕",
  info: "ℹ",
};

function ToastItem({ toast, onDismiss }) {
  const itemRef = useRef(null);

  useEffect(() => {
    if (!itemRef.current) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const anim = animate(itemRef.current, {
      opacity: [0, 1],
      translateY: [-10, 0],
      duration: 250,
      ease: "outQuad",
    });

    return () => {
      if (anim && typeof anim.cancel === "function") anim.cancel();
    };
  }, []);

  return (
    <div
      ref={itemRef}
      className={`alert alert-${toast.variant === "danger" ? "danger" : toast.variant === "info" ? "info" : "success"} toast-card`}
      role="status"
    >
      <div className="toast-icon">{ICONS[toast.variant] || ICONS.success}</div>

      <div className="toast-body">
        {toast.title && <strong>{toast.title}</strong>}
        {toast.message && <p>{toast.message}</p>}
      </div>

      <button
        type="button"
        className="btn-close toast-close"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      />
    </div>
  );
}

export default function NotificationToast() {
  const { toasts, dismissToast } = useNotifications();

  if (!toasts.length) return null;

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
