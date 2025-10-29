// matcha/src/app/auth/reset/[token]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
	const router = useRouter();
	const { token } = useParams();
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (password !== confirm) {
			setMessage("Passwords doesn't match.");
			return;
		}

		setLoading(true);
		setMessage(null);

		const res = await fetch("/api/e-mail/password-confirm", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token, password }),
		});

		if (res.ok) {
			setMessage("Password successfully updated !");
			setTimeout(() => router.push("/auth"), 2000);
		} else {
			const data = await res.json();
			setMessage(data.error || "Error during reset.");
		}

		setLoading(false);
	};


	// TODO add password safety
	return (
		<div className="flex items-center justify-center h-full">
			<div className="w-full max-w-sm bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
				<h1 className="text-xl font-semibold mb-4 text-center">
					New Password
				</h1>

				<form onSubmit={handleSubmit} className="space-y-4">
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="new password"
						className="w-full border rounded-md px-3 py-2"
						required
					/>
					<input
						type="password"
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						placeholder="confirm new password"
						className="w-full border rounded-md px-3 py-2"
						required
					/>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
					>
						{loading ? "updating..." : "Validate"}
					</button>
				</form>

				{message && (
					<p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-300">
						{message}
					</p>
				)}
			</div>
		</div>
	);
}