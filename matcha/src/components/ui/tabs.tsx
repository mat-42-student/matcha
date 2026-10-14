"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";

type TabsState = {
  active: string;
  setActive: (value: string) => void;
};

const TabsContext = React.createContext<TabsState | null>(null);

function useTabs(): TabsState {
  const tabs = React.useContext(TabsContext);
  if (!tabs) throw new Error("Tabs components must be rendered inside <Tabs>");
  return tabs;
}

export function Tabs({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = searchParams.get("tab") || defaultValue;
  const [active, setActiveState] = React.useState(initialTab);

  const setActive = (value: string) => {
    setActiveState(value);
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.replace(`?${params.toString()}`);
  };

  return (
    <TabsContext value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext>
  );
}

export function TabsList({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex border-b ${className}`}>{children}</div>;
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const { active, setActive } = useTabs();
  const isActive = active === value;
  return (
    <button
      onClick={() => setActive(value)}
      className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
        isActive
          ? "border-pink-600 text-pink-600 font-semibold"
          : "border-transparent text-gray-600 hover:text-pink-600"
      }`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const { active } = useTabs();
  if (active !== value) return null;
  return <div className="mt-4">{children}</div>;
}
