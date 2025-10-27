// matcha/src/context/LocalUserContext.tsx

"use client";

import { createContext, useContext, useState } from "react";
import { PublicUser } from "@/lib/types";

const LocalUserContext = createContext<{
  user: PublicUser;
  setUser: (u: PublicUser) => void;
}>({
  user: {} as PublicUser,
  setUser: () => {},
});

export function LocalUserProvider({
  initialUser,
  onUpdate,
  children,
}: {
  initialUser: PublicUser;
  onUpdate(u: PublicUser): void;
  children: React.ReactNode;
}) {
  const [user, setUsersState] = useState(initialUser);

  function setUser(u: PublicUser) {
    setUsersState(u);
    onUpdate(u);
  }

  return (
    <LocalUserContext.Provider value={{ user, setUser }}>
      {children}
    </LocalUserContext.Provider>
  );
}

export const useLocalUser = () => useContext(LocalUserContext);
