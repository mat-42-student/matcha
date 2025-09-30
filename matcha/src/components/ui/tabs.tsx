"use client";

import * as React from "react";

export function Tabs({ defaultValue, children, className }: any) {
	const [active, setActive] = React.useState(defaultValue);

	// On clone les enfants pour propager l’état
	return (
		<div className={className}>
			{React.Children.map(children, (child: any) =>
				React.cloneElement(child, { active, setActive })
			)}
		</div>
	);
}

export function TabsList({ children, className, active, setActive }: any) {
	return (
		<div className={`flex border-b ${className}`}>
			{React.Children.map(children, (child: any) =>
				React.cloneElement(child, { active, setActive })
			)}
		</div>
	);
}

export function TabsTrigger({ value, children, active, setActive }: any) {
	const isActive = active === value;
	return (
		<button
			onClick={() => setActive(value)}
			className={`px-4 py-2 -mb-px border-b-2 transition-colors ${isActive
					? "border-pink-600 text-pink-600 font-semibold"
					: "border-transparent text-gray-600 hover:text-pink-600"
				}`}
		>
			{children}
		</button>
	);
}

export function TabsContent({ value, children, active }: any) {
	if (active !== value) return null;
	return <div className="mt-4">{children}</div>;
}