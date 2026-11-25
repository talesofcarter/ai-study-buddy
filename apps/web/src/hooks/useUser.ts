import { useCallback } from "react";
import { USER_SCHEMA } from "../lib/schemas";
import type { UserProfile } from "../types";
import { useStoredState } from "./useStoredState";

export interface ProfileInput {
  readonly name: string;
  readonly email: string;
}

export function useUser(): {
  user: UserProfile | null;
  saveProfile: (input: ProfileInput) => void;
  clearProfile: () => void;
} {
  const [user, setUser] = useStoredState(USER_SCHEMA);

  const saveProfile = useCallback(
    (input: ProfileInput) =>
      setUser({
        name: input.name,
        email: input.email,
        createdAt: new Date().toISOString(),
      }),
    [setUser],
  );
  const clearProfile = useCallback(() => setUser(null), [setUser]);

  return { user, saveProfile, clearProfile };
}
