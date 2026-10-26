"use client";

import { useState } from "react";
import { PublicUser } from "@/lib/types";

export type FilterValues = {
  sortBy: string;
  ageMin: string;
  ageMax: string;
  distance: string;
  fameMin: string;
  fameMax: string;
  tagsMin: string;
};

type FilterBarProps = {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
};

export const DEFAULT_FILTERS: FilterValues = {
  sortBy: "score-desc",
  ageMin: "",
  ageMax: "",
  distance: "",
  fameMin: "",
  fameMax: "",
  tagsMin: "",
};

// Empty or invalid field = no limit
function parseBound(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

export function filterUsers(users: PublicUser[], filters: FilterValues) {
  const ageMin = parseBound(filters.ageMin);
  const ageMax = parseBound(filters.ageMax);
  const maxDistance = parseBound(filters.distance);
  const fameMin = parseBound(filters.fameMin);
  const fameMax = parseBound(filters.fameMax);
  const tagsMin = parseBound(filters.tagsMin);

  const result = users.filter((u) =>
    (ageMin === null || u.age >= ageMin) &&
    (ageMax === null || u.age <= ageMax) &&
    (maxDistance === null || u.distance <= maxDistance) &&
    (fameMin === null || u.fame >= fameMin) &&
    (fameMax === null || u.fame <= fameMax) &&
    (tagsMin === null || u.commonTags >= tagsMin)
  );

  const [key, order] = filters.sortBy.split("-");
  return result.sort((a, b) => {
    let diff = 0;
    if (key === "score") diff = a.score - b.score;
    if (key === "age") diff = a.age - b.age;
    if (key === "dist") diff = a.distance - b.distance;
    if (key === "fame") diff = a.fame - b.fame;
    if (key === "tags") diff = a.commonTags - b.commonTags;

    return order === "desc" ? -diff : diff;
  });
}

export default function FilterSidebar({ values, onChange }: FilterBarProps) {
  // null: breakpoint default (open from md, closed on mobile), decided in CSS so the server render matches
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  // values only change through this component (apply / reset), which already updates the draft
  const [draftValues, setDraftValues] = useState(values);

  function updateValue<K extends keyof FilterValues>(
    key: K,
    value: FilterValues[K],
  ) {
    setDraftValues((current) => ({ ...current, [key]: value }));
  }

  function toggle() {
    const shown = isOpen ?? window.matchMedia("(min-width: 768px)").matches;
    setIsOpen(!shown);
  }

  // Hidden content when closed, or on mobile by default
  const contentVisibility = isOpen === null ? "hidden md:flex" : isOpen ? "flex" : "hidden";

  return (
    <aside
      className={`relative flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300 ease-in-out z-20 ${
        isOpen === null
          ? "w-16 md:w-72"
          : isOpen
            // Mobile: drawn over the cards instead of squeezing them
            ? "w-72 max-md:absolute max-md:left-0 max-md:top-0 max-md:h-auto max-md:max-h-[calc(100dvh-4rem)] max-md:shadow-xl"
            : "w-16"
      }`}
    >
      {/* En-tête / Bouton rétractable */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className={`${contentVisibility} items-center gap-2`}>
          <svg
            className="w-5 h-5 text-pink-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm tracking-wide uppercase">
            Filtres
          </span>
        </div>

        <button
          onClick={toggle}
          className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mx-auto"
          aria-label="Afficher / masquer les filtres"
        >
          <svg
            className={`w-5 h-5 transform transition-transform duration-300 ${
              isOpen === null ? "max-md:rotate-180" : !isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Contenu rétractable */}
      <div className={`${contentVisibility} flex-col justify-between flex-1 p-4 space-y-6 overflow-y-auto`}>
        <div className="space-y-5">
          {/* Tri */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Trier par
            </label>
            <select
              value={draftValues.sortBy}
              onChange={(e) => updateValue("sortBy", e.target.value)}
              className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 outline-none transition"
            >
              <option value="score-desc">Score (Décroissant)</option>
              <option value="score-asc">Score (Croissant)</option>
              <option value="age-asc">Âge (Plus jeune)</option>
              <option value="age-desc">Âge (Plus âgé)</option>
              <option value="dist-asc">Distance (Plus proche)</option>
              <option value="dist-desc">Distance (Plus éloigné)</option>
              <option value="fame-desc">Popularité (Décroissant)</option>
              <option value="fame-asc">Popularité (Croissant)</option>
              <option value="tags-desc">Tags communs (Plus)</option>
              <option value="tags-asc">Tags communs (Moins)</option>
            </select>
          </div>

          {/* Tranche d'âge */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Âge
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={draftValues.ageMin}
                onChange={(e) => updateValue("ageMin", e.target.value)}
                className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 outline-none transition"
              />
              <input
                type="number"
                placeholder="Max"
                value={draftValues.ageMax}
                onChange={(e) => updateValue("ageMax", e.target.value)}
                className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 outline-none transition"
              />
            </div>
          </div>

          {/* Distance maximale */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Rayon maximum (km)
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="Ex: 50"
                value={draftValues.distance}
                onChange={(e) => updateValue("distance", e.target.value)}
                className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 pr-10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 outline-none transition"
              />
              <span className="absolute right-3 top-2.5 text-xs text-zinc-400 pointer-events-none">
                km
              </span>
            </div>
          </div>

          {/* Tranche de popularité */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Popularité ⭐
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={draftValues.fameMin}
                onChange={(e) => updateValue("fameMin", e.target.value)}
                className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 outline-none transition"
              />
              <input
                type="number"
                placeholder="Max"
                value={draftValues.fameMax}
                onChange={(e) => updateValue("fameMax", e.target.value)}
                className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 outline-none transition"
              />
            </div>
          </div>

          {/* Tags communs minimum */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Tags communs (minimum)
            </label>
            <input
              type="number"
              placeholder="Ex: 2"
              value={draftValues.tagsMin}
              onChange={(e) => updateValue("tagsMin", e.target.value)}
              className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 outline-none transition"
            />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => onChange(draftValues)}
            className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          >
            Appliquer les filtres
          </button>
          <button
            onClick={() => {
              setDraftValues(DEFAULT_FILTERS);
              onChange(DEFAULT_FILTERS);
            }}
            className="w-full py-2 px-4 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-medium rounded-lg transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </aside>
  );
}

