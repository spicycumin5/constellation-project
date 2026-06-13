"use client";

import { useState } from "react";
import type { GeocodeResult } from "@/app/api/geocode/route";

interface LocationSearchProps {
  onSelect: (latitude: number, longitude: number, name: string) => void;
}

export function LocationSearch({ onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) throw new Error("Search failed");
      const data = (await response.json()) as { results: GeocodeResult[] };
      setResults(data.results);
      if (data.results.length === 0) setError("No matching places found");
    } catch {
      setError("Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(result: GeocodeResult) {
    onSelect(result.latitude, result.longitude, result.name);
    setResults([]);
    setQuery(result.name);
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-zinc-400">Location search</span>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          placeholder="City, landmark, address..."
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSearch();
            }
          }}
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-zinc-100 outline-none focus:border-sky-400"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "..." : "Search"}
        </button>
      </div>

      {error && <p className="text-[11px] text-amber-400">{error}</p>}

      {results.length > 0 && (
        <ul className="flex flex-col overflow-hidden rounded-md border border-white/10 bg-black/70">
          {results.map((result) => (
            <li key={`${result.latitude},${result.longitude}`}>
              <button
                type="button"
                onClick={() => handleSelect(result)}
                className="w-full px-2 py-1.5 text-left text-xs text-zinc-200 transition-colors hover:bg-white/10"
              >
                {result.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
