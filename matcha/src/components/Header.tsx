export function Header() {
  return (
    <header className="w-full bg-pink-800 text-white shadow-lg">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold">
          <a href="/">Matcha</a>
        </h1>
        <nav className="flex gap-4">
          <a href="/browse" className="hover:underline">Découvrir</a>
          <a href="/profile" className="hover:underline">Profile</a>
          <a href="/chat" className="hover:underline transition duration-300">Chat</a>
          <a href="/search" className="hover:scale-150 transition duration-300">🔍</a>
        </nav>
      </div>
    </header>
  )
}