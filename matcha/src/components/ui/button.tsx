import * as React from "react";

export function Button({
	children,
	className = "",
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			className={`rounded-lg bg-pink-600 px-4 py-2 text-white font-semibold hover:bg-pink-700 transition ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}