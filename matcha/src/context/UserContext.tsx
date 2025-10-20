// src/context/UserContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { PublicUser } from "@/lib/types";

interface UserContextType {
  user: PublicUser | null;
  setUser: (user: PublicUser | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  initialUser
}: {
  children: ReactNode;
  initialUser: PublicUser | null }) {

  const [user, setUser] = useState<PublicUser | null>(initialUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}