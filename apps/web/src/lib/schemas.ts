import type { ThemeMode, UserProfile } from "../types";
import { isRecord } from "./guards";
import type { StorageSchema } from "./storage";
import { validateEmail, validateName } from "./validation";

export const THEME_SCHEMA: StorageSchema<ThemeMode> = {
  key: "theme",
  version: 1,
  fallback: "light", // light is the product default
  parse: (raw) => (raw === "light" || raw === "dark" ? raw : null),
};

export const USER_SCHEMA: StorageSchema<UserProfile | null> = {
  key: "user",
  version: 1,
  fallback: null,
  parse: (raw) => {
    if (!isRecord(raw)) return null;
    const { name, email, createdAt } = raw;
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof createdAt !== "string"
    ) {
      return null;
    }
    const checkedName = validateName(name);
    const checkedEmail = validateEmail(email);
    if (!checkedName.valid || !checkedEmail.valid) return null;
    return { name: checkedName.value, email: checkedEmail.value, createdAt };
  },
};
