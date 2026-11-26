import { TriangleAlert } from "lucide-react";

export function StorageWarning() {
  return (
    <div role="alert" className="border-b border-hard/50 bg-sunken">
      <div className="mx-auto flex w-full max-w-6xl items-start gap-3 px-4 py-3 sm:px-6">
        <TriangleAlert
          className="mt-0.5 h-5 w-5 shrink-0 text-hard"
          aria-hidden="true"
        />
        <p className="text-sm">
          <strong className="font-bold text-hard">
            Changes aren't being saved.
          </strong>{" "}
          Your browser blocked or filled its storage, so this session may be
          lost when you close the tab. Free up space or leave private browsing,
          then make a change to try again.
        </p>
      </div>
    </div>
  );
}
