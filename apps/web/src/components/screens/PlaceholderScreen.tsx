import { Link } from "react-router-dom";
import { buttonStyles } from "../ui/Button";

interface PlaceholderScreenProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PlaceholderScreen({
  eyebrow,
  title,
  description,
}: PlaceholderScreenProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
      <section
        aria-labelledby="placeholder-title"
        className="flex max-w-xl flex-col items-start gap-4"
      >
        <span className="highlight text-sm font-bold leading-8">{eyebrow}</span>
        <h1
          id="placeholder-title"
          className="font-card text-3xl font-semibold leading-tight sm:text-4xl"
        >
          {title}
        </h1>
        <p className="text-lg text-muted">{description}</p>
        <Link to="/" className={buttonStyles("secondary", "mt-2")}>
          Back to the starter set
        </Link>
      </section>
    </div>
  );
}
