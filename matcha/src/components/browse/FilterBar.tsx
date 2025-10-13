"use client";

import { useState } from "react";
import { PublicUser } from "@/types";

type FilterBarProps = {
  users: PublicUser[];
  onChange: (filtered: PublicUser[]) => void;
};

export default function FilterBar({ users, onChange }: FilterBarProps) {
  const [filtersVisible, setFilersVisisble] = useState(false);

  const [search, setSearch] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [distance, setDistance] = useState("");

  function applyFilters() {
    let result = users;

    if (search) {
      result = result.filter((u) =>
        u.first_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (ageMin) {
      result = result.filter((u) => u.age >= parseInt(ageMin));
    }

    if (ageMax) {
      result = result.filter((u) => u.age <= parseInt(ageMax));
    }

    if (distance) {
      result = result.filter((u) => u.distance <= parseInt(distance)
      );
    }

    onChange(result);
  }

  function resetFilters() {
    setSearch("");
    setAgeMin("");
    setAgeMax("");
    setDistance("");
    onChange(users);
  }

  return (<>
    <button 
      className="inline"
      onClick={() => setFilersVisisble(!filtersVisible)}>☰</button>
      { filtersVisible &&
      <div className="flex space-x-2 w-full justify-center">
        <input
          type="number"
          placeholder="Min age"
          value={ageMin}
          onChange={(e) => setAgeMin(e.target.value)}
          className="border-pink-800 border-2 p-2 rounded w-24"
        />
        <input
          type="number"
          placeholder="Max age"
          max={100}
          value={ageMax}
          onChange={(e) => setAgeMax(e.target.value)}
          className="border-pink-800 border-2 p-2 rounded w-24"
        />
        <input
          type="text"
          placeholder="Distance"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          className="border-pink-800 border-2 p-2 rounded"
        />

        <button
          onClick={applyFilters}
          className="bg-pink-800 text-white px-4 py-2 rounded"
        >
          Apply
        </button>
        <button
          onClick={resetFilters}
          className="bg-gray-400 text-white px-4 py-2 rounded"
        >
          Reset
        </button>
      </div>}
  </>
  );
}
