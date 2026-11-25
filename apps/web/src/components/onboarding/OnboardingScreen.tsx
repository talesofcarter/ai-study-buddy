import { useRef, useState, type FormEvent } from "react";
import { STARTER_DECK } from "../../data/starterDeck";
import type { ProfileInput } from "../../hooks/useUser";
import { validateEmail, validateName } from "../../lib/validation";
import { FlashcardView } from "../flashcards/FlashcardView";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";

interface OnboardingScreenProps {
  onComplete: (profile: ProfileInput) => void;
}

type FieldName = "name" | "email";

const previewCard = STARTER_DECK[0];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [values, setValues] = useState<Record<FieldName, string>>({
    name: "",
    email: "",
  });
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    name: false,
    email: false,
  });
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const nameResult = validateName(values.name);
  const emailResult = validateEmail(values.email);
  const nameError =
    touched.name && !nameResult.valid ? nameResult.message : null;
  const emailError =
    touched.email && !emailResult.valid ? emailResult.message : null;

  const touch = (field: FieldName): void =>
    setTouched((current) => ({ ...current, [field]: true }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setTouched({ name: true, email: true });

    if (!nameResult.valid) {
      nameRef.current?.focus();
    } else if (!emailResult.valid) {
      emailRef.current?.focus();
    } else {
      onComplete({ name: nameResult.value, email: emailResult.value });
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-16 lg:py-16">
      <section aria-labelledby="intro-title" className="flex flex-col gap-6">
        <h1
          id="intro-title"
          className="font-card text-3xl font-semibold leading-tight sm:text-4xl"
        >
          Turn your notes into cards you can flip, review and keep.
        </h1>
        <p className="max-w-prose text-lg text-muted">
          Your cards are saved in this browser, so they are still here when you
          come back.
        </p>
        {previewCard ? (
          <div className="hidden max-w-xl lg:block">
            <FlashcardView
              card={previewCard}
              flipped={previewFlipped}
              onFlip={() => setPreviewFlipped((value) => !value)}
              stackDepth={2}
            />
            <p className="text-sm text-muted">Click the card to flip it.</p>
          </div>
        ) : null}
      </section>

      <section
        aria-labelledby="setup-title"
        className="rounded-card border border-line/25 bg-surface p-6 shadow-card sm:p-8"
      >
        <h2 id="setup-title" className="font-card text-2xl font-semibold">
          Set up your study desk
        </h2>
        <p className="mt-1 text-muted">
          Add your name and email so your archive is labelled and ready next
          time.
        </p>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-5"
        >
          <TextField
            ref={nameRef}
            label="Name"
            name="name"
            autoComplete="name"
            autoCapitalize="words"
            value={values.name}
            error={nameError}
            onChange={(event) =>
              setValues((v) => ({ ...v, name: event.target.value }))
            }
            onBlur={() => touch("name")}
          />
          <TextField
            ref={emailRef}
            label="Email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            hint="Stays in this browser. It is not sent anywhere."
            value={values.email}
            error={emailError}
            onChange={(event) =>
              setValues((v) => ({ ...v, email: event.target.value }))
            }
            onBlur={() => touch("email")}
          />
          <Button type="submit" className="mt-1 w-full">
            Start studying
          </Button>
        </form>
      </section>
    </div>
  );
}
