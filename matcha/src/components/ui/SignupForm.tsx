// "use client";

// import { useRouter } from "next/navigation";
// import { useState } from "react";

// export default function SignupForm() {
// 	const router = useRouter();
// 	const [error, setError] = useState("");

// 	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
// 		e.preventDefault();
// 		const formData = new FormData(e.currentTarget);

// 		const res = await fetch("/api/signup", {
// 			method: "POST",
// 			body: formData,
// 		});

// 		if (res.ok) {
// 			router.push("/auth"); // ✅ redirection vers /auth
// 		} else {
// 			const data = await res.json();
// 			setError(data.error || "Erreur inconnue");
// 		}
// 	}

// 	return (
// 		<form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 mx-auto mt-10">
// 			<input
// 				name="email"
// 				type="email"
// 				placeholder="Email"
// 				required
// 				className="px-4 py-2 rounded-full border border-gray-300"
// 			/>
// 			<input
// 				name="password"
// 				type="password"
// 				placeholder="Mot de passe"
// 				required
// 				className="px-4 py-2 rounded-full border border-gray-300"
// 			/>
// 			<button
// 				type="submit"
// 				className="bg-pink-600 text-white rounded-full py-2 hover:bg-pink-700 transition"
// 			>
// 				Créer un compte
// 			</button>
// 			{error && <p className="text-red-500 text-center">{error}</p>}
// 		</form>
// 	);
// }