"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
	id: string;
	email: string;
	username: string;
}

export function Header() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchUser() {
			try {
				const res = await fetch("/api/me");
				const data = await res.json();
				setUser(data.user);
			} catch (err) {
				console.error("Erreur fetch /api/me:", err);
				setUser(null);
			} finally {
				setLoading(false);
			}
		}

		fetchUser();
	}, []);

	async function handleLogout() {
		await fetch("/api/logout", { method: "POST" });
		setUser(null);
		window.location.href = "/auth"; // redirige vers login
	}

	return (
		<header className="w-full bg-white shadow p-4 flex justify-between items-center">
			<Link href="/" className="text-xl font-bold">
				Matcha 🍵
			</Link>

			{!loading && (
				<nav className="flex gap-4">
					{user ? (
						<>
							<Link href="/profile">Profil</Link>
							<button
								onClick={handleLogout}
								className="text-red-600 hover:underline"
							>
								Logout
							</button>
						</>
					) : (
						<>
							<Link href="/auth">Login</Link>
							<Link href="/signup" className="font-semibold text-green-600">
								Signup
							</Link>
						</>
					)}
				</nav>
			)}
		</header>
	);
}