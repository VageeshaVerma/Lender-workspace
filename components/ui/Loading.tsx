type LoadingProps = {
  message?: string;
};

export default function Loading({
  message = "Loading...",
}: LoadingProps) {
  return (
    <div
      className="flex min-h-40 flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--blush)] border-t-[var(--coral)]" />

      <p className="text-sm text-[var(--text-secondary)]">
        {message}
      </p>
    </div>
  );
}