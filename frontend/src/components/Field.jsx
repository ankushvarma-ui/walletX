export default function Field({
  label,
  type = "text",
  value,
  onChange,
  ...props
}) {
  const id = label.replaceAll(" ", "-");

  return (
    <div className="mb-3">
      <label
        className="form-label"
        htmlFor={id}
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        {...props}
      />
    </div>
  );
}