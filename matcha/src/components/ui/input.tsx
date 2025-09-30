import * as React from "react";

export const Input = React.forwardRef<HTMLInputElement, any>(
	({ className = "", ...props }, ref) => (
		<input
			ref={ref}
			className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 ${className}`}
			{...props}
		/>
	)
);

Input.displayName = "Input";