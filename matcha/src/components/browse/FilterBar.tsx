"use client";

import { useState } from "react";
import { PublicUser } from "@/lib/types";

type FilterBarProps = {
  users: PublicUser[];
  onChange: (filtered: PublicUser[]) => void;
};

export default function FilterSidebar({ users, onChange }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const [sortBy, setSortBy] = useState("score-desc");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [distance, setDistance] = useState("");

  function applyFilters() {
    let result = users;

    if (ageMin) {
      const min = parseInt(ageMin, 10);
      if (!isNaN(min)) result = result.filter((u) => u.age >= min);
    }
    if (ageMax) {
      const max = parseInt(ageMax, 10);
      if (!isNaN(max)) result = result.filter((u) => u.age <= max);
    }
    if (distance) {
      const dist = parseInt(distance, 10);
      if (!isNaN(dist)) result = result.filter((u) => u.distance <= dist);
    }

    if (sortBy) {
      const [key, order] = sortBy.split("-");

      result = [...result].sort((a, b) => {
        let diff = 0;
        if (key === "score") diff = a.score - b.score;
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
    setSortBy("score-desc");
    onChange(users);
  }

  return (
    <aside
      className={`relative flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300 ease-in-out z-20 ${
        isOpen ? "w-72" : "w-16"
      }`}
    >
      {/* En-tête / Bouton rétractable */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
        {isOpen && (
          <div className="flex items-center gap-2">
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
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mx-auto"
          aria-label={isOpen ? "Réduire le panneau" : "Agrandir le panneau"}
        >
          <svg
            className={`w-5 h-5 transform transition-transform duration-300 ${
              !isOpen ? "rotate-180" : ""
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
      {isOpen && (
        <div className="flex flex-col justify-between flex-1 p-4 space-y-6 overflow-y-auto">
          <div className="space-y-5">
            {/* Tri */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 outline-none transition"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
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
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 pr-10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 outline-none transition"
                />
                <span className="absolute right-3 top-2.5 text-xs text-zinc-400 pointer-events-none">
                  km
                </span>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={applyFilters}
              className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            >
              Appliquer les filtres
            </button>
            <button
              onClick={resetFilters}
              className="w-full py-2 px-4 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-medium rounded-lg transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

// "use client";

// import { useState } from "react";
// import { PublicUser } from "@/lib/types";

// type FilterBarProps = {
//   users: PublicUser[];
//   onChange: (filtered: PublicUser[]) => void;
// };

// export default function FilterBar({ users, onChange }: FilterBarProps) {
//   const [sortBy, setSortBy] = useState("");

//   const [ageMin, setAgeMin] = useState("");
//   const [ageMax, setAgeMax] = useState("");
//   const [distance, setDistance] = useState("");

//   function applyFilters() {
//     let result = users;

//     if (ageMin)
//       result = result.filter((u) => u.age >= parseInt(ageMin));
//     if (ageMax)
//       result = result.filter((u) => u.age <= parseInt(ageMax));
//     if (distance)
//       result = result.filter((u) => u.distance <= parseInt(distance));
//     if (sortBy) {
//       const [key, order] = sortBy.split("-");

//       result = [...result].sort((a, b) => {
//         let diff = 0;

//         if (key === "score") diff = a.score - b.score;
//         if (key === "age") diff = a.age - b.age;
//         if (key === "dist") diff = a.distance - b.distance;
//         if (key === "fame") diff = a.fame - b.fame;

//         return order === "desc" ? -diff : diff;
//       });
//     }
//     onChange(result);
//   }

//   function resetFilters() {
//     setAgeMin("");
//     setAgeMax("");
//     setDistance("");
//     onChange(users);
//   }

// return (
//   <div className="flex flex-col md:flex-row items-center gap-2 w-full">
//     {/* Filtres */}
//       <div
//         className="
//           flex flex-col md:flex-row
//           gap-2 md:gap-4
//           md:flex-1
//           justify-center
//         "
//       >
//         <input
//           type="text"
//           placeholder="Min age"
//           value={ageMin}
//           onChange={(e) => setAgeMin(e.target.value)}
//           className="border-pink-800 border-2 p-2 rounded w-full md:w-24
//            focus:outline-none focus:ring-1 focus:ring-pink-600 transition duration-150"
//         />
//         <input
//           type="text"
//           placeholder="Max age"
//           value={ageMax}
//           onChange={(e) => setAgeMax(e.target.value)}
//           className="border-pink-800 border-2 p-2 rounded w-full md:w-24
//            focus:outline-none focus:ring-1 focus:ring-pink-600 transition duration-150"
//         />
//         <input
//           type="text"
//           placeholder="Max km"
//           value={distance}
//           onChange={(e) => setDistance(e.target.value)}
//           className="border-pink-800 border-2 p-2 rounded w-full md:w-24
//            focus:outline-none focus:ring-1 focus:ring-pink-600 transition duration-150"
//         />
//         <select
//           onChange={(e) => setSortBy(e.target.value)}
//           className="border-pink-800 border-2 p-2 rounded w-full md:w-24
//            focus:outline-none focus:ring-1 focus:ring-pink-600 transition duration-150"
//           >
//           <option value="score-desc">Score ▼</option>
//           <option value="score-asc">Score ▲</option>
//           <option value="age-asc">Age ▲</option>
//           <option value="age-desc">Age ▼</option>
//           <option value="dist-asc">Km ▲</option>
//           <option value="dist-desc">Km ▼</option>
//           <option value="fame-desc">Fame ▼</option>
//           <option value="fame-asc">Fame ▲</option>
//         </select>
//         <div className="flex gap-2">
//           <button
//             onClick={applyFilters}
//             className="bg-pink-800 text-white px-4 py-2 rounded w-full md:w-auto
//             focus:outline-none focus:ring-1 focus:ring-pink-600 transition duration-150"
//           >
//             Apply
//           </button>
//           <button
//             onClick={resetFilters}
//             className="bg-gray-400 text-white px-4 py-2 rounded w-full md:w-auto
//             focus:outline-none focus:ring-1 focus:ring-pink-600 transition duration-150"
//           >
//             Reset
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }