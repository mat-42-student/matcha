// src/context/UsersStore.tsx
"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { LikeStatus, PublicUser } from "@/lib/types";

type UsersStoreType = {
  users: PublicUser[];
  updateUser: (u: PublicUser) => void;
  updateUserLikeStatus: (userId: string, likeStatus: LikeStatus) => void;
  removeUser: (userId: string) => void;
  setUsers: (users: PublicUser[]) => void;
};

const UsersStoreContext = createContext<UsersStoreType>({
  users: [],
  updateUser: () => {},
  updateUserLikeStatus: () => {},
  removeUser: () => {},
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
  const [prevInitialUsers, setPrevInitialUsers] = useState(initialUsers);

  // Reset the store when the parent provides a new list (adjusted during render, not in an effect)
  if (initialUsers !== prevInitialUsers) {
    setPrevInitialUsers(initialUsers);
    setUsers(initialUsers);
  }

  const updateUser = useCallback((u: PublicUser) => {
    setUsers(prev => prev.map(user => (user.id === u.id ? u : user)));
  }, []);

  // A blocked user (in either direction) leaves the list instead of staying as a greyed card
  const removeUser = useCallback((userId: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  }, []);

  const updateUserLikeStatus = useCallback((userId: string, likeStatus: LikeStatus) => {
    if (likeStatus === "block") return removeUser(userId);
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, likeStatus } : user))
    );
  }, [removeUser]);

  return (
    <UsersStoreContext.Provider value={{ users, updateUser, updateUserLikeStatus, removeUser, setUsers }}>
      {children}
    </UsersStoreContext.Provider>
  );
};

export const useUsersStore = () => useContext(UsersStoreContext);