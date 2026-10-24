export default function ErrorAlert({ children, onClose }) {
  if (!children) return null;

  return (
    <div className="alert alert-danger d-flex align-items-center justify-content-between my-2" role="alert">
      <div>{children}</div>
      {onClose && (
        <button
          type="button"
          className="btn-close ms-2"
          aria-label="Close"
          onClick={onClose}
        />
      )}
    </div>
  );
}
