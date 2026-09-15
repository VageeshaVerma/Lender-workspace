type BadgeProps = {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
};

export default function Badge({
  children,
  variant = "neutral",
}: BadgeProps) {
  const variantStyles = {
    success: "status-success",
    warning: "status-warning",
    danger: "status-danger",
    info: "status-info",
    neutral: "bg-black/5 text-[var(--text-secondary)]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}