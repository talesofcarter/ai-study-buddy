import { useEffect, useRef, useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";

interface SetTitleProps {
  title: string;
  onRename: (title: string) => void;
}

export function SetTitle({ title, onRename }: SetTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [attempted, setAttempted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    if (editing) {
      inputRef.current?.select();
    } else if (returnFocus.current) {
      returnFocus.current = false;
      editRef.current?.focus();
    }
  }, [editing]);

  const begin = (): void => {
    setDraft(title);
    setAttempted(false);
    setEditing(true);
  };

  const finish = (save: boolean): void => {
    returnFocus.current = true;
    if (save) onRename(draft);
    setEditing(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (draft.trim().length === 0) {
      setAttempted(true);
      inputRef.current?.focus();
      return;
    }
    finish(true);
  };

  if (editing) {
    return (
      <form
        noValidate
        onSubmit={handleSubmit}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            finish(false);
          }
        }}
        className="flex w-full flex-col gap-3"
      >
        <TextField
          ref={inputRef}
          label="Set title"
          name="title"
          maxLength={80}
          autoComplete="off"
          value={draft}
          error={
            attempted && draft.trim().length === 0
              ? "Give the set a name."
              : null
          }
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button variant="secondary" onClick={() => finish(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex w-full items-start gap-2">
      <h1
        id="set-title"
        className="min-w-0 flex-1 wrap-break-word font-card text-3xl font-semibold leading-tight"
      >
        {title}
      </h1>
      <button
        ref={editRef}
        type="button"
        aria-label="Rename set"
        onClick={begin}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-ctl text-muted hover:bg-sunken hover:text-ink"
      >
        <Pencil className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
