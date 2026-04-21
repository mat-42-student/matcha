// src/context/UsersStore.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LikeStatus, PublicUser } from "@/lib/types";

type UsersStoreType = {
  users: PublicUser[];
  updateUser: (u: PublicUser) => void;
  updateUserLikeStatus: (userId: string, likeStatus: LikeStatus) => void;
  setUsers: (users: PublicUser[]) => void;
};

const UsersStoreContext = createContext<UsersStoreType>({
  users: [],
  updateUser: () => {},
  updateUserLikeStatus: () => {},
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

  const updateUser = useCallback((u: PublicUser) => {
    setUsers(prev => prev.map(user => (user.id === u.id ? u : user)));
  }, []);

  const updateUserLikeStatus = useCallback((userId: string, likeStatus: LikeStatus) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, likeStatus } : user))
    );
  }, []);

  return (
    <UsersStoreContext.Provider value={{ users, updateUser, updateUserLikeStatus, setUsers }}>
      {children}
    </UsersStoreContext.Provider>
  );
};

export const useUsersStore = () => useContext(UsersStoreContext);