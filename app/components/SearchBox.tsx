"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Search } from "lucide-react";

const FILTERS = [
  { id: "any-length", label: "Any length" },
  { id: "standalones-only", label: "Standalones only" },
  { id: "content-notes", label: "Content notes" },
] as const;

const EXAMPLE_PROMPTS = [
  "Cozy fantasy with found family",
  "A slow-burn mystery in a remote setting",
  "Sad but hopeful, under 300 pages",
];

function chipClasses(active: boolean) {
  return active
    ? "border border-border-strong bg-accent-soft text-accent-soft-text"
    : "border border-border-strong bg-transparent text-text-soft";
}

export function SearchBox() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  function toggleFilter(id: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function applyExample(prompt: string) {
    setQuery(prompt);
    textareaRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      textareaRef.current?.focus();
      return;
    }
    const params = new URLSearchParams({ q: query.trim() });
    for (const id of activeFilters) params.append("filter", id);
    router.push(`/results?${params.toString()}`);
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3.5 bg-surface border border-border-strong rounded-[20px] p-[22px] pb-4 shadow-[0_0_0_4px_rgba(201,184,255,0.08)]"
      >
        <label
          htmlFor="q"
          className="text-[13px] font-semibold text-text-muted uppercase tracking-[1px]"
        >
          Your mood
        </label>
        <textarea
          ref={textareaRef}
          id="q"
          rows={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe the kind of book you want: the feeling, the setting, the pace…"
          className="border-none outline-none resize-none bg-transparent font-serif text-xl sm:text-2xl lg:text-[28px] leading-[1.3] text-text p-0"
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border pt-3.5">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((filter) => {
              const active = activeFilters.has(filter.id);
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleFilter(filter.id)}
                  className={`text-sm px-3.5 py-2.5 rounded-full min-h-11 ${chipClasses(active)}`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-accent text-bg text-base font-semibold px-[22px] rounded-full min-h-12 box-border no-underline"
          >
            <Search size={18} aria-hidden="true" />
            Find my next read
          </button>
        </div>
      </form>

      <div className="flex items-center justify-center gap-2.5 flex-wrap">
        <span className="text-sm text-text-muted">Try:</span>
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => applyExample(prompt)}
            className="border border-border bg-surface text-text-soft text-sm px-3.5 py-2.5 rounded-full min-h-11"
          >
            {prompt}
          </button>
        ))}
      </div>
    </>
  );
}
