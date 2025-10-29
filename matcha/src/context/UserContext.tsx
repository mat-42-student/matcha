// src/context/UserContext.tsx
"use client";

import { createContext, useContext, useState } from "react";
import type { PublicUser } from "@/lib/types";

interface UserContextType {
  me: PublicUser | null;
  setMe: (me: PublicUser | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  initialUser
}: {
  children: React.ReactNode;
  initialUser: PublicUser | null }) {

  const [me, setMe] = useState<PublicUser | null>(initialUser);

  return (
    <UserContext.Provider value={{ me, setMe }}>
      {children}
    </UserContext.Provider>
  );
}

export function useMe() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useMe must be used within a UserProvider");
  return context;
}