import { useState } from "react";

/**
 * Returns `value`, or the last non-null value once it becomes null. Lets a
 * page keep showing its data through an exit animation after the data is
 * deleted. `value` must be referentially stable between renders.
 */
export function useRetained<T>(value: T | null): T | null {
  const [retained, setRetained] = useState<T | null>(value);
  if (value !== null && value !== retained) setRetained(value);
  return value ?? retained;
}
