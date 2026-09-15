type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this information. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="glass flex min-h-48 flex-col items-center justify-center rounded-3xl px-6 py-10 text-center"
      role="alert"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger)]/10 text-xl text-[var(--danger)]">
        !
      </div>

      <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary mt-5 px-5 py-2.5 text-sm font-medium"
        >
          Try again
        </button>
      )}
    </div>
  );
}