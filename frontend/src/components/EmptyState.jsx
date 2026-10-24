export default function EmptyState({ text = "No records found.", action }) {
  return (
    <div className="text-center p-4 my-3 text-muted">
      <p className="mb-2">{text}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
