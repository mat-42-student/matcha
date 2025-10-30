// src/context/UsersStore.tsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { PublicUser } from "@/lib/types";

type UsersStoreType = {
  users: PublicUser[];
  updateUser: (u: PublicUser) => void;
  setUsers: (users: PublicUser[]) => void;
};

const UsersStoreContext = createContext<UsersStoreType>({
  users: [],
  updateUser: () => {},
  setUsers: () => {},
});

export function UsersStoreProvider({
  children,
  initialUsers,
}: {
  children: React.ReactNode;
  initialUsers: PublicUser[];
}) {

  const [users, setUsers] = useState(initialUsers);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const updateUser = (u: PublicUser) => {
    setUsers(prev => prev.map(user => (user.id === u.id ? u : user)));
  };

  return (
    <UsersStoreContext.Provider value={{ users, updateUser, setUsers }}>
      {children}
    </UsersStoreContext.Provider>
  );
};

export const useUsersStore = () => useContext(UsersStoreContext);