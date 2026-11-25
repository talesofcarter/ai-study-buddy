import { STARTER_DECK } from "../../data/starterDeck";
import type { UserProfile } from "../../types";
import { FlashcardStage } from "../flashcards/FlashcardStage";
import { Button } from "../ui/Button";

interface HomeScreenProps {
  user: UserProfile;
  onSwitchProfile: () => void;
}

const KBD = "rounded border border-line/40 bg-surface px-1.5 text-sm";

export function HomeScreen({ user, onSwitchProfile }: HomeScreenProps) {
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14 lg:py-14">
      <section
        aria-labelledby="home-title"
        className="flex flex-col items-start gap-4"
      >
        <p className="text-muted">Hi, {firstName}</p>
        <h1
          id="home-title"
          className="font-card text-3xl font-semibold leading-tight"
        >
          Starter set
        </h1>
        <p>
          Four cards on how to study well. Try the flip before you add your own
          notes.
        </p>
        <p className="text-muted">
          Click a card to flip it. <kbd className={KBD}>←</kbd>{" "}
          <kbd className={KBD}>→</kbd> move between cards,{" "}
          <kbd className={KBD}>Space</kbd> flips.
        </p>
        <Button variant="ghost" onClick={onSwitchProfile} className="-ml-5">
          Switch profile
        </Button>
      </section>

      <section
        aria-label="Flashcards"
        className="mx-auto w-full max-w-2xl lg:mx-0"
      >
        <FlashcardStage cards={STARTER_DECK} />
      </section>
    </div>
  );
}
