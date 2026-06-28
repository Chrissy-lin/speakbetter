"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NotebookEntry } from "@/lib/types";

const STORAGE_KEY = "speakbetter:notebook";

type NewEntry = Pick<NotebookEntry, "word" | "meaning" | "example">;

export function useNotebook() {
  const [entries, setEntries] = useState<NotebookEntry[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      setEntries(JSON.parse(raw) as NotebookEntry[]);
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = useCallback((entry: NewEntry) => {
    setEntries((current) => {
      if (current.some((item) => item.word.toLowerCase() === entry.word.toLowerCase())) {
        return current;
      }

      return [
        {
          ...entry,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString()
        },
        ...current
      ];
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  const words = useMemo(() => new Set(entries.map((entry) => entry.word.toLowerCase())), [entries]);

  const hasEntry = useCallback((word: string) => words.has(word.toLowerCase()), [words]);

  return {
    entries,
    addEntry,
    removeEntry,
    clearEntries,
    hasEntry
  };
}
