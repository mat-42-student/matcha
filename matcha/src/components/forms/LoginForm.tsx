"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
// dans ton composant LoginForm ou page login
import { useUser } from "@/context/UserContext";



export default function LoginForm() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
    const { setUser } = useUser();

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const formData = new FormData(e.currentTarget);

		try {
			const res = await fetch("/api/login", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Invalid login");
				return;
			}

			// ✅ Succès → redirection
            //window.dispatchEvent(new Event("user-logged-in"));
            setUser(data.user);
			router.push("/");

		} catch (err) {
			console.error(err);
			setError("Network error");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col gap-4 w-80 mx-auto mt-10 bg-white p-8 rounded-2xl shadow-md"
		>
			<h1 className="text-2xl font-bold text-center text-pink-700">
				Login
			</h1>

			{error && (
				<p className="text-red-600 text-sm text-center">{error}</p>
			)}

			<input
				type="email"
				name="email"
				placeholder="Email"
				required
				className="px-4 py-2 rounded-full border border-gray-300 
                   focus:outline-none focus:ring-2 focus:ring-pink-400
                   text-gray-900"
			/>

			<input
				type="password"
				name="password"
				placeholder="Password"
				required
				className="px-4 py-2 rounded-full border border-gray-300 
                   focus:outline-none focus:ring-2 focus:ring-pink-400
                   text-gray-900"
			/>

			<button
				type="submit"
				disabled={loading}
				className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold 
                   hover:bg-pink-700 transition disabled:opacity-50"
			>
				{loading ? "Loging in..." : "Log in"}
			</button>
		</form>
	);
}