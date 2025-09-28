export default function Navigation( {
  page,
  totalPages,
  prev,
  next,
}: {
  page: number;
  totalPages: number;
  prev: () => void;
  next: () => void
}) {

  return (
    <div className="flex gap-2 mt-4 justify-center">
      <button
        onClick={prev}
        disabled={page === 1}
        className="px-3 py-1 rounded bg-pink-700 disabled:opacity-50 shadow-md hover:bg-pink-800"
      >
        ◀
      </button>

      <span className="px-2 py-1">
        Page {page} / {totalPages}
      </span>

      <button
        onClick={next}
        disabled={page === totalPages}
        className="px-3 py-1 rounded bg-pink-700 disabled:opacity-50 shadow-md hover:bg-pink-800"
      >
        ▶
      </button>
    </div>

  )
  }
