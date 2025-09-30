import * as React from "react";

export const Textarea = React.forwardRef<HTMLTextAreaElement, any>(
	({ className = "", ...props }, ref) => (
		<textarea
			ref={ref}
			className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 ${className}`}
			{...props}
		/>
	)
);

Textarea.displayName = "Textarea";