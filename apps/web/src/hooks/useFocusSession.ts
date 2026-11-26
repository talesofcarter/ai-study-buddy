import { useCallback, useMemo, useReducer, useState } from "react";
import type { Direction } from "../lib/motion";
import type { Flashcard, Rating } from "../types";

interface State {
  readonly queue: readonly Flashcard[];
  /** Equals queue.length once the session is finished. */
  readonly index: number;
  readonly flipped: boolean;
  readonly direction: Direction;
  readonly ratings: Readonly<Record<string, Rating>>;
}

type Action =
  | { type: "flip" }
  | { type: "move"; delta: Direction }
  | { type: "rate"; cardId: string; rating: Rating }
  | { type: "restart"; queue: readonly Flashcard[] };

const createState = (queue: readonly Flashcard[]): State => ({
  queue,
  index: 0,
  flipped: false,
  direction: 1,
  ratings: {},
});

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "flip":
      return state.index >= state.queue.length
        ? state
        : { ...state, flipped: !state.flipped };
    case "move": {
      const next = state.index + action.delta;
      if (next < 0 || next > state.queue.length) return state;
      return { ...state, index: next, flipped: false, direction: action.delta };
    }
    case "rate":
      return {
        ...state,
        ratings: { ...state.ratings, [action.cardId]: action.rating },
        index: Math.min(state.index + 1, state.queue.length),
        flipped: false,
        direction: 1,
      };
    case "restart":
      return createState(action.queue);
  }
}

export interface FocusCounts {
  readonly easy: number;
  readonly medium: number;
  readonly hard: number;
  readonly skipped: number;
}

export function useFocusSession(
  cards: readonly Flashcard[],
  onRate?: (cardId: string, rating: Rating) => void,
) {
  // The session works on a snapshot: ratings changing the archive underneath
  // must not reshuffle the queue mid-session.
  const [all] = useState(cards);
  const [state, dispatch] = useReducer(reducer, all, createState);
  const { queue, index, ratings } = state;

  const card: Flashcard | undefined = queue[index];
  const finished = index >= queue.length;

  const counts = useMemo<FocusCounts>(() => {
    const tally = { easy: 0, medium: 0, hard: 0 };
    for (const item of queue) {
      const rating = ratings[item.id];
      if (rating) tally[rating] += 1;
    }
    return {
      ...tally,
      skipped: queue.length - tally.easy - tally.medium - tally.hard,
    };
  }, [queue, ratings]);

  const flip = useCallback(() => dispatch({ type: "flip" }), []);
  const move = useCallback(
    (delta: Direction) => dispatch({ type: "move", delta }),
    [],
  );
  const rate = useCallback(
    (rating: Rating) => {
      if (!card) return;
      onRate?.(card.id, rating); // persist first; the reducer only tracks the session
      dispatch({ type: "rate", cardId: card.id, rating });
    },
    [card, onRate],
  );
  const restart = useCallback(
    () => dispatch({ type: "restart", queue: all }),
    [all],
  );
  const reviewHard = useCallback(
    () =>
      dispatch({
        type: "restart",
        queue: queue.filter((item) => ratings[item.id] === "hard"),
      }),
    [queue, ratings],
  );

  return {
    queue,
    index,
    card,
    flipped: state.flipped,
    direction: state.direction,
    ratings,
    counts,
    finished,
    flip,
    move,
    rate,
    restart,
    reviewHard,
  };
}
