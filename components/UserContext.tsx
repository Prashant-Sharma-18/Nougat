"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getUsers, getOrCreateDefaultUser } from "@/actions/users";
import { CurrencyCode } from "@/lib/currency/fx";
import { getAccountType, AccountType } from "@/lib/auth/roles";

export type PortalMode = "PERSONAL" | "CORPORATE" | "ADMIN" | "GENERAL" | "ENTERPRISE";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  pointBalance: number;
}

interface UserContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  loading: boolean;
  currentCurrency: CurrencyCode;
  portalMode: PortalMode;
  accountType: AccountType;
  setPortalMode: (mode: PortalMode) => void;
  isPersonal: boolean;
  isCorporate: boolean;
  isAdmin: boolean;
  isEnterprise: boolean;
  setCurrentCurrency: (currency: CurrencyCode) => void;
  switchUser: (userId: string) => void;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  updateUserBalance: (newBalance: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCurrency, setCurrencyState] = useState<CurrencyCode>("USD");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCurrency = localStorage.getItem("loyalty_currency") as CurrencyCode | null;
      if (savedCurrency) setCurrencyState(savedCurrency);
    }
  }, []);

  const setCurrentCurrency = (currency: CurrencyCode) => {
    setCurrencyState(currency);
    if (typeof window !== "undefined") {
      localStorage.setItem("loyalty_currency", currency);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getUsers();
      if (allUsers.length === 0) {
        const def = await getOrCreateDefaultUser();
        setUsers([def as UserProfile]);
        setCurrentUser(def as UserProfile);
      } else {
        setUsers(allUsers as UserProfile[]);
        // Check if there is an active user saved in localStorage
        const savedId = typeof window !== "undefined" ? localStorage.getItem("loyalty_active_user_id") : null;
        const matching = savedId ? allUsers.find((u) => u.id === savedId) : null;
        const active = (matching || allUsers[0]) as UserProfile;
        setCurrentUser(active);
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      if (typeof window !== "undefined") {
        localStorage.setItem("loyalty_active_user_id", userId);
      }
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("loyalty_active_user_id");
    }
    // Switch to first personal consumer user
    const personal = users.find((u) => getAccountType(u) === "PERSONAL") || users[0];
    if (personal) {
      setCurrentUser(personal);
    }
  };

  const setPortalMode = (mode: PortalMode) => {
    const targetType = mode === "ENTERPRISE" || mode === "CORPORATE" 
      ? "CORPORATE" 
      : mode === "ADMIN" 
      ? "ADMIN" 
      : "PERSONAL";
    // Find matching user for requested portal mode
    const match = users.find((u) => getAccountType(u) === targetType);
    if (match) {
      switchUser(match.id);
    }
  };

  const updateUserBalance = (newBalance: number) => {
    if (currentUser) {
      const updated = { ...currentUser, pointBalance: newBalance };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    }
  };

  const refreshUserData = async () => {
    try {
      const allUsers = await getUsers();
      setUsers(allUsers as UserProfile[]);
      if (currentUser) {
        const currentUpdated = allUsers.find((u) => u.id === currentUser.id);
        if (currentUpdated) {
          setCurrentUser(currentUpdated as UserProfile);
        }
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  // Derive account role and portal access strictly from the active user's identity
  const accountType: AccountType = getAccountType(currentUser);
  const isPersonal = accountType === "PERSONAL";
  const isCorporate = accountType === "CORPORATE";
  const isAdmin = accountType === "ADMIN";
  const isEnterprise = isCorporate;
  const portalMode: PortalMode = accountType;

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        loading,
        currentCurrency,
        portalMode,
        accountType,
        setPortalMode,
        isPersonal,
        isCorporate,
        isAdmin,
        isEnterprise,
        setCurrentCurrency,
        switchUser,
        logout,
        refreshUserData,
        updateUserBalance,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

