type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  label?: string;
  name: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
};

export default function Select({
  label,
  name,
  options,
  value,
  defaultValue,
  placeholder,
  disabled = false,
  required = false,
  error,
  onChange,
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
        >
          {label}

          {required && (
            <span className="ml-1 text-[var(--danger)]">*</span>
          )}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        onChange={onChange}
        className={`input-glass px-4 py-3 text-sm ${
          error
            ? "border-[var(--danger)] focus:border-[var(--danger)]"
            : ""
        } ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1.5 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}