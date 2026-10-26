"use client";

import { useState, useEffect } from "react";
import { FameRange, SearchCriteria } from "@/lib/types";

// last step of the distance slider, shown as "500+ km" and sent as no limit
const MAX_DISTANCE = 500;
const distanceLabel = (d: number) => (d >= MAX_DISTANCE ? `${MAX_DISTANCE}+ km` : `${d} km`);

export default function SearchForm({ onSubmit }: { onSubmit: (criteria: SearchCriteria) => void }) {
  const [collapsed, setCollapsed] = useState(false);

  // Toggle filters on/off
  const [useDistance, setUseDistance] = useState(false);
  const [useAge, setUseAge] = useState(false);
  const [useInterests, setUseInterests] = useState(false);
  const [useFame, setUseFame] = useState(false);

  // setters
  const [distance, setDistance] = useState(50);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 99]);
  const [interestsMode, setInterestsMode] = useState<"similar" | "custom">("similar");
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  // kept as strings so a bound can be left empty (= no limit)
  const [fameMin, setFameMin] = useState("");
  const [fameMax, setFameMax] = useState("");

  const [allInterests, setAllInterests] = useState<string[]>([]);

  useEffect(() => {
    async function fetchInterests() {
      try {
        const res = await fetch("/api/interests");
        if (!res.ok) throw new Error("Failed to fetch interests");
        const data = await res.json();
        const names = data.map((i: { name: string }) => i.name);
        setAllInterests(names);
      } catch (err) {
        console.error(err);
      }
    }
    fetchInterests();
  }, []);

  const fameRange: FameRange = {
    min: fameMin === "" ? undefined : Number(fameMin),
    max: fameMax === "" ? undefined : Number(fameMax),
  };
  const isBadBound = (n?: number) => n !== undefined && !(Number.isInteger(n) && n >= 0 && n <= 100);
  const fameError = !useFame
    ? null
    : isBadBound(fameRange.min) || isBadBound(fameRange.max)
      ? "Fame bounds must be whole numbers between 0 and 100"
      : fameRange.min !== undefined && fameRange.max !== undefined && fameRange.min > fameRange.max
        ? "Minimum fame must be lower than maximum"
        : null;
  const fameInvalid = fameError !== null;

  const isBadAge = (n: number) => !(Number.isInteger(n) && n >= 18 && n <= 100);
  const ageError = !useAge
    ? null
    : isBadAge(ageRange[0]) || isBadAge(ageRange[1])
      ? "Ages must be whole numbers between 18 and 100"
      : ageRange[0] > ageRange[1]
        ? "Minimum age must be lower than maximum"
        : null;
  const ageInvalid = ageError !== null;

  function fameLabel() {
    const { min, max } = fameRange;
    if (!useFame || (min === undefined && max === undefined)) return "All";
    if (max === undefined) return `${min}+`;
    if (min === undefined) return `≤ ${max}`;
    return `${min} - ${max}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fameInvalid || ageInvalid) return;
    const criteria: SearchCriteria = {};
    if (useDistance && distance < MAX_DISTANCE) criteria.distance = distance;
    if (useAge) criteria.ageRange = ageRange;
    if (useInterests) {
      criteria.interests = interestsMode;
      criteria.customInterests = customInterests;
    }
    if (useFame) criteria.fameRange = fameRange;
    onSubmit(criteria);
    setCollapsed(true);
  }

  if (collapsed) {
    // only the criteria that were actually sent with the search
    const interestsLabel = !useInterests
      ? null
      : interestsMode === "similar"
        ? "shared interests"
        : customInterests.length > 0
          ? customInterests.slice(0, 5).join(", ") + (customInterests.length > 5 ? "…" : "")
          : null;
    const hasCriteria = useDistance || useAge || useFame || interestsLabel !== null;

    return (
      <button
        type="button"
        className="w-full p-3 bg-blue-50 border rounded flex flex-wrap items-center text-left text-sm text-black"
        onClick={() => setCollapsed(false)}
      >
        {useDistance && <span className="mr-2">📍 {distanceLabel(distance)}</span>}
        {useAge && <span className="mr-2">🎂 {ageRange[0]} - {ageRange[1]}</span>}
        {useFame && <span className="mr-2">⭐ {fameLabel()}</span>}
        {interestsLabel && <span className="mr-2">🎯 {interestsLabel}</span>}
        {!hasCriteria && <span className="mr-2">All profiles</span>}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-4 max-w-md mx-auto bg-white rounded-2xl text-black"
    >
      <div className="flex justify-between">
        <button type="button" onClick={() => setCollapsed(true)} aria-label="Collapse search">🔺</button>
        <span>Advanced search</span>
      </div>
      {/* Distance */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={useDistance}
          onChange={() => setUseDistance(!useDistance)}
          id="distance-filter"
        />
        <label htmlFor="distance-filter" className="block font-medium mb-2">Distance (km)</label>
        <input
          type="range"
          min="0"
          max={MAX_DISTANCE}
          step="5"
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          className="flex-1"
          disabled={!useDistance}
        />
        <span className="text-sm ml-2">{distanceLabel(distance)}</span>
      </div>

      {/* Age */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={useAge}
          onChange={() => setUseAge(!useAge)}
          id="age-filter"
        />
        <label htmlFor="age-filter" className="block font-medium mb-2">Age</label>
        <input
          type="number"
          min={18}
          max={ageRange[1]}
          value={ageRange[0]}
          onChange={(e) => setAgeRange([+e.target.value, ageRange[1]])}
          className={`border rounded p-2 w-20 ${ageInvalid ? "border-red-500" : ""}`}
          disabled={!useAge}
        />
        <span>-</span>
        <input
          type="number"
          min={ageRange[0]}
          max={100}
          value={ageRange[1]}
          onChange={(e) => setAgeRange([ageRange[0], +e.target.value])}
          className={`border rounded p-2 w-20 ${ageInvalid ? "border-red-500" : ""}`}
          disabled={!useAge}
        />
      </div>
      {ageError && (
        <p className="text-sm text-red-600 -mt-4">{ageError}</p>
      )}

      {/* Interests */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={useInterests}
            onChange={() => setUseInterests(!useInterests)}
            id="interests-filter"
          />
          <label htmlFor="interests-filter" className="font-medium">Looking for people</label>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="interests"
              value="similar"
              checked={interestsMode === "similar"}
              onChange={() => setInterestsMode("similar")}
              disabled={!useInterests}
            />
            <span>who share my interests</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="interests"
              value="custom"
              checked={interestsMode === "custom"}
              onChange={() => setInterestsMode("custom")}
              disabled={!useInterests}
            />
            <span>with at least one of these interests</span>
          </label>
        </div>
        {useInterests && interestsMode === "custom" && (
          <select
            multiple
            value={customInterests}
            onChange={(e) =>
              setCustomInterests(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            className="w-full border rounded p-2 mt-2 h-32"
          >
            {allInterests.map((interest) => (
              <option key={interest} value={interest}>
                {interest}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Fame */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={useFame}
          onChange={() => setUseFame(!useFame)}
          id="fame-filter"
        />
        <label htmlFor="fame-filter" className="block font-medium mb-2">Fame ⭐</label>
        <input
          type="number"
          min={0}
          max={100}
          placeholder="0"
          value={fameMin}
          onChange={(e) => setFameMin(e.target.value)}
          className={`border rounded p-2 w-20 ${fameInvalid ? "border-red-500" : ""}`}
          aria-label="Minimum fame"
          disabled={!useFame}
        />
        <span>-</span>
        <input
          type="number"
          min={0}
          max={100}
          placeholder="100"
          value={fameMax}
          onChange={(e) => setFameMax(e.target.value)}
          className={`border rounded p-2 w-20 ${fameInvalid ? "border-red-500" : ""}`}
          aria-label="Maximum fame"
          disabled={!useFame}
        />
      </div>
      {fameError && (
        <p className="text-sm text-red-600 -mt-4">{fameError}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={fameInvalid || ageInvalid}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Search
      </button>
    </form>
  );
}
