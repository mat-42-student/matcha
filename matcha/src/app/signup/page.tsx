export default function SignupPage() {
return (
    <div className="flex items-center justify-center min-h-screen">
    <form 
        method="POST" 
        action="/api/signup"
        className="bg-white p-8 rounded-2xl shadow-md flex flex-col gap-4 w-96"
    >
        <h1 className="text-2xl font-bold text-center text-pink-700">
        Créer un compte
        </h1>
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
            placeholder="Mot de passe"
            className="px-4 py-2 rounded-full border border-gray-300 
                        focus:outline-none focus:ring-2 focus:ring-pink-400
                        placeholder-gray-400
                        text-gray-900"
        />
        <button
        type="submit"
        className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700 transition"
        >
        S'inscrire
        </button>
    </form>
    </div>
);
}