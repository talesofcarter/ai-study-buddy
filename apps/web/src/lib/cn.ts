type ClassPart = string | false | null | undefined;

export function cn(...parts: ClassPart[]): string {
  return parts.filter(Boolean).join(" ");
}
