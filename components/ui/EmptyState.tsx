type EmptyStateProps = {
  title: string;
  message?: string;
  action?: React.ReactNode;
};

export default function EmptyState({
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="glass flex min-h-48 flex-col items-center justify-center rounded-3xl px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--soft-rose,#f1dadb)] text-xl">
        ○
      </div>

      <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
        {title}
      </h3>

      {message && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
          {message}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}