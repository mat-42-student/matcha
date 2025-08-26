'use_client';

export function LoginForm() {
  return (
    <form method="POST" action="/api/login" className="flex flex-col gap-4">
        <input
        type="text"
        name="email"
        placeholder="Email"
        className="px-4 py-2 rounded-full border border-gray-300 
                    focus:outline-none focus:ring-2 focus:ring-pink-400
                    placeholder-gray-400
                    text-gray-900"
        />

        <input
        type="password"
        name="password"
        placeholder="Password"
        className="px-4 py-2 rounded-full border border-gray-300 
                    focus:outline-none focus:ring-2 focus:ring-pink-400
                    placeholder-gray-400
                    text-gray-900"
        />
      <button
        type="submit"
        className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700 transition"
      >
        Login
      </button>
    </form>
  );
}