// "use client";
import Browse from "@/components/browse/Browse";
import Geoloc from "@/components/geoloc/Geoloc"

export default function Homepage() {
  return (
    <>
      <Browse />
      <Geoloc userId="3eff5f12-1e3c-4e09-a17e-911654525826" />
    </>
  )
}

// Belongs to Browse component ? 

//     // Étend la hauteur du <main> (qui est déjà "flex-1 overflow-hidden")
//     <div className="h-full overflow-auto p-4">
//       <h1 className="text-xl font-bold mb-4">Users – Page {page}</h1>

//       {loading && <p>Chargement...</p>}

//       <div className="flex flex-wrap justify-center gap-4">
//         {users.map((u) => (
//           <CardUser key={u.username} user={u} />
//         ))}
//       </div>

//       <div className="flex gap-2 mt-4">
//         <button
//           onClick={() => setPage((p) => Math.max(1, p - 1))}
//           disabled={page === 1}
//           className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
//         >
//           Précédent
//         </button>
//         <button
//           onClick={() => setPage((p) => p + 1)}
//           className="px-3 py-1 rounded bg-gray-200"
//         >
//           Suivant
//         </button>
//       </div>
//     </div>
//   );
// }
