export default function Alert({ children }) {
  return (
    <div className="alert alert-danger">
      {children}
    </div>
  );
}