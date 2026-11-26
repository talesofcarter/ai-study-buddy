import type { NavItem } from "../types";

export const NAV_ITEMS: readonly NavItem[] = [
  {
    to: "/",
    label: "Study",
    description: "Flip through your cards.",
  },
  {
    to: "/generate",
    label: "Generate",
    description: "Turn your notes into cards.",
  },
  {
    to: "/archive",
    label: "Archive",
    description: "Search and manage saved sets.",
  },
];
