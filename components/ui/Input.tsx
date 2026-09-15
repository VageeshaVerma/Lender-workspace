type InputProps = {
  label?: string;
  name: string;
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  maxLength?: number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function Input({
  label,
  name,
  type = "text",
  placeholder,
  value,
  defaultValue,
  disabled = false,
  required = false,
  error,
  maxLength,
  onChange,
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
          {required && <span className="ml-1 text-[var(--danger)]">*</span>}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        onChange={onChange}
        className={`input-glass px-4 py-3 text-sm ${
          error
            ? "border-[var(--danger)] focus:border-[var(--danger)]"
            : ""
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      />

      {error && (
        <p className="mt-1.5 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}