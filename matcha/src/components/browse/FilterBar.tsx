"use client";

import { useState } from "react";
import { PublicUser } from "@/lib/types";

type FilterBarProps = {
  users: PublicUser[];
  onChange: (filtered: PublicUser[]) => void;
};

export default function FilterBar({ users, onChange }: FilterBarProps) {
  const [sortBy, setSortBy] = useState("");

  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [distance, setDistance] = useState("");

  function applyFilters() {
    let result = users;

    if (ageMin)
      result = result.filter((u) => u.age >= parseInt(ageMin));
    if (ageMax)
      result = result.filter((u) => u.age <= parseInt(ageMax));
    if (distance)
      result = result.filter((u) => u.distance <= parseInt(distance));
    if (sortBy) {
      const [key, order] = sortBy.split("-");

      result = [...result].sort((a, b) => {
        let diff = 0;

        if (key === "age") diff = a.age - b.age;
        if (key === "dist") diff = a.distance - b.distance;
        if (key === "fame") diff = a.fame - b.fame;

        return order === "desc" ? -diff : diff;
      });
    }
    onChange(result);
  }

  function resetFilters() {
    setAgeMin("");
    setAgeMax("");
    setDistance("");
    onChange(users);
  }

return (
  <div className="flex flex-col md:flex-row items-center gap-2 w-full">
    {/* Bouton menu
    <button
      className="p-2 text-2xl md:hidden"
      onClick={() => setFilersVisisble(!filtersVisible)}
    >
      ☰
    </button>
 */}
    {/* Filtres */}
      <div
        className="
          flex flex-col md:flex-row
          gap-2 md:gap-4
          md:flex-1
          justify-center
        "
      >
        <input
          type="text"
          placeholder="Min age"
          value={ageMin}
          onChange={(e) => setAgeMin(e.target.value)}
          className="border-pink-800 border-2 p-2 rounded w-full md:w-24"
        />
        <input
          type="text"
          placeholder="Max age"
          value={ageMax}
          onChange={(e) => setAgeMax(e.target.value)}
          className="border-pink-800 border-2 p-2 rounded w-full md:w-24"
        />
        <input
          type="text"
          placeholder="Max km"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          className="border-pink-800 border-2 p-2 rounded w-full md:w-32"
        />
        <select
          onChange={(e) => setSortBy(e.target.value)}
          className="border-pink-800 border-2 p-2 rounded w-full md:w-24 inline"
          >
          <option value="">Sort By</option>
          <option value="age-asc">Age ▲</option>
          <option value="age-desc">Age ▼</option>
          <option value="dist-asc">Km ▲</option>
          <option value="dist-desc">Km ▼</option>
          <option value="fame-asc">Fame ▲</option>
          <option value="fame-desc">Fame ▼</option>
        </select>
        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="bg-pink-800 text-white px-4 py-2 rounded w-full md:w-auto"
          >
            Apply
          </button>
          <button
            onClick={resetFilters}
            className="bg-gray-400 text-white px-4 py-2 rounded w-full md:w-auto"
          >
            Reset
          </button>
        </div>

      </div>
  </div>
);

  // return (<>
  //   <button 
  //     className="inline"
  //     onClick={() => setFilersVisisble(!filtersVisible)}>☰</button>
  //     { filtersVisible &&
  //     <div className="flex space-x-2 w-full justify-center">
  //       <input
  //         type="number"
  //         placeholder="Min age"
  //         value={ageMin}
  //         onChange={(e) => setAgeMin(e.target.value)}
  //         className="border-pink-800 border-2 p-2 rounded w-24"
  //       />
  //       <input
  //         type="number"
  //         placeholder="Max age"
  //         max={100}
  //         value={ageMax}
  //         onChange={(e) => setAgeMax(e.target.value)}
  //         className="border-pink-800 border-2 p-2 rounded w-24"
  //       />
  //       <input
  //         type="text"
  //         placeholder="Distance"
  //         value={distance}
  //         onChange={(e) => setDistance(e.target.value)}
  //         className="border-pink-800 border-2 p-2 rounded"
  //       />

  //       <button
  //         onClick={applyFilters}
  //         className="bg-pink-800 text-white px-4 py-2 rounded"
  //       >
  //         Apply
  //       </button>
  //       <button
  //         onClick={resetFilters}
  //         className="bg-gray-400 text-white px-4 py-2 rounded"
  //       >
  //         Reset
  //       </button>
  //     </div>}
  // </>
  // );
}
