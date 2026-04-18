// Static visual mock of the customer-facing cancel modal.
export function CancelModalMock() {
  return (
    <div className="rounded-xl border border-strong bg-[var(--bg)] shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-soft text-[12px] text-muted">
        <span>example.com / my-account / subscriptions</span>
        <span className="text-muted-2">Customer view</span>
      </div>
      <div className="p-6">
        <div className="text-[13px] text-muted">Wait - before you cancel</div>
        <h3 className="mt-1 text-lg font-semibold tracking-tightish">
          We can hold your subscription for 30 days, free.
        </h3>
        <p className="mt-2 text-sm text-muted max-w-md">
          You said you've been too busy to use it lately. Pause and we'll resume on the date you choose. No charge in between.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg">
            Pause for 30 days
          </button>
          <button className="inline-flex h-9 items-center rounded-md border border-strong px-4 text-sm">
            Pause for 60 days
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-soft">
          <a href="#" className="text-sm text-muted underline underline-offset-4 hover:text-[var(--fg)]">
            No thanks, cancel my subscription
          </a>
          <div className="mt-1 text-[11px] text-muted-2">One click away. Always.</div>
        </div>
      </div>
    </div>
  );
}
