import * as React from "react";

export function Card({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-xl border bg-white shadow p-4">{children}</div>
	);
}

export function CardContent({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={className}>{children}</div>;
}