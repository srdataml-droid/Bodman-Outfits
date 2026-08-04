"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

interface FocusParamResult {
  /**
   * Attach to each row element, keyed by record id. The hook scrolls to the
   * matching one; rows that never mount are simply never scrolled to.
   */
  rowRefs: RefObject<Map<string, HTMLElement>>;
  /**
   * True when the link named a record that is not in the loaded list. Worth
   * surfacing: the lists are capped at 200, so an old record can legitimately
   * be missing and silence would look like a broken link.
   */
  focusMissing: boolean;
}

/**
 * Handles the `?focus=<id>` deep link that the submission notification emails
 * point at, so an email lands the owner on the actual record rather than on a
 * list they then have to search.
 *
 * Reads `window.location.search` rather than `useSearchParams` deliberately.
 * The admin screens are statically prerendered, and `useSearchParams` would
 * force a Suspense boundary on every page using it. The parameter is only
 * meaningful on the client, so there is nothing to gain from the router hook.
 *
 * ONE-SHOT BY DESIGN. The handled flag flips on the first run whether or not
 * a matching row was found, so the deep link cannot keep yanking the
 * selection back to the emailed record every time the list refreshes after a
 * status change. Someone who arrives from an email, reads the record, then
 * clicks a different row should stay where they clicked.
 */
export function useFocusParam<T extends { id: string }>(
  rows: T[] | null,
  select: (id: string) => void,
): FocusParamResult {
  const [handled, setHandled] = useState(false);
  const [focusMissing, setFocusMissing] = useState(false);
  const rowRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (handled || rows === null) return;
    setHandled(true);

    const focusId = new URLSearchParams(window.location.search).get("focus");
    if (focusId === null) return;

    if (!rows.some((row) => row.id === focusId)) {
      setFocusMissing(true);
      return;
    }

    select(focusId);
    rowRefs.current.get(focusId)?.scrollIntoView({ block: "center", behavior: "smooth" });
    // `select` is intentionally not a dependency: it is a setState function
    // in both call sites, and including it would not change when this runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, handled]);

  return { rowRefs, focusMissing };
}
