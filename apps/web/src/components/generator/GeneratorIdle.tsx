export function GeneratorIdle() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-card border border-dashed border-line/40 px-6 py-8 text-center sm:py-10">
      <div aria-hidden="true" className="relative h-32 w-full max-w-xs sm:h-40">
        <span className="absolute inset-x-8 bottom-0 top-5 rounded-card border border-line/20 bg-sunken" />
        <span className="absolute inset-x-4 bottom-2.5 top-2.5 rounded-card border border-line/25 bg-surface" />
        <span className="ruled absolute inset-x-0 bottom-5 top-0 flex flex-col gap-3 rounded-card border border-line/25 bg-surface px-6 pt-7 shadow-card">
          <span className="h-3 w-16 rounded-full bg-accent/60" />
          <span className="h-3 w-3/4 rounded-full bg-sunken" />
          <span className="h-3 w-1/2 rounded-full bg-sunken" />
        </span>
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <h2 className="font-card text-xl font-semibold">
          Your cards will appear here
        </h2>
        <p className="text-muted">
          Choose <strong className="font-bold text-ink">New set</strong> to
          paste your notes. The finished set opens right here, already saved to
          your archive.
        </p>
      </div>
    </div>
  );
}
