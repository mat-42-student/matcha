// matcha/src/app/auth/reset-request/page.tsx
"use client";

import { useState } from "react";

export default function ResetRequestPage() {
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setMessage(null);

		const res = await fetch("/api/e-mail/password-request", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email }),
		});

		if (res.ok) {
			setMessage("A reset password email has been sent.");
		} else {
			const data = await res.json();
			setMessage(data.error || "Error during e-mail sending.");
		}

		setLoading(false);
	};

	return (
		<div className="flex items-center justify-center h-full">
			<div className="w-full max-w-sm bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
				<h1 className="text-xl font-semibold mb-4 text-center">
					Reset password
				</h1>

				<form onSubmit={handleSubmit} className="space-y-4">
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="your e-mail"
						className="w-full border rounded-md px-3 py-2"
						required
					/>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
					>
						{loading ? "sendind..." : "Send link"}
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