type ButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "coral" | "secondary" | "danger";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
  onClick,
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";

  const variantStyles = {
    primary: "bg-[var(--text-primary)] text-white hover:opacity-90",
    coral: "btn-coral",
    secondary:
      "border border-white/70 bg-white/40 text-[var(--text-primary)] hover:bg-white/60",
    danger:
      "bg-[var(--danger)] text-white hover:opacity-90",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}