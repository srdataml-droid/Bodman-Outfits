"use client";

import { useMemo, useState } from "react";
import type { FaqEntry } from "../lib/faq-data";

interface FaqListProps {
  entries: FaqEntry[];
}

export function FaqList({ entries }: FaqListProps): React.ReactElement {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return entries;
    return entries.filter(
      (entry) =>
        entry.question.toLowerCase().includes(normalizedQuery) ||
        entry.answer.toLowerCase().includes(normalizedQuery),
    );
  }, [entries, query]);

  const categories = useMemo(() => {
    const grouped = new Map<string, FaqEntry[]>();
    for (const entry of [...filtered].sort((a, b) => a.sortOrder - b.sortOrder)) {
      const categoryLabel = entry.category ?? "General";
      const list = grouped.get(categoryLabel) ?? [];
      list.push(entry);
      grouped.set(categoryLabel, list);
    }
    return [...grouped.entries()];
  }, [filtered]);

  return (
    <div>
      <div className="mx-auto max-w-xl">
        <label htmlFor="faq-search" className="sr-only">
          Search FAQs
        </label>
        <input
          id="faq-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a question…"
          className="min-h-11 w-full rounded-xl border border-[var(--outline)] bg-white px-5 py-3 text-base text-[var(--ink)] placeholder:text-[rgb(65_72_67_/_45%)] focus:border-[var(--copper)] focus:outline-none"
        />
      </div>

      <div className="mt-16 space-y-14">
        {categories.length === 0 ? (
          <p className="text-center text-base text-[var(--muted-ink)]">
            No questions match &quot;{query}&quot;.
          </p>
        ) : (
          categories.map(([category, categoryEntries]) => (
            <div key={category}>
              <h2 className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">{category}</h2>
              <div className="mt-6 divide-y divide-[var(--outline)] border-t border-[var(--outline)]">
                {categoryEntries.map((entry) => (
                  <details key={entry.id} className="group py-6">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium text-[var(--everglade)] marker:content-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]">
                      {entry.question}
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-2xl font-normal leading-none text-[var(--copper)] transition-transform duration-300 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-ink)]">{entry.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
