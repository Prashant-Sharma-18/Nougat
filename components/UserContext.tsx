"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getUsers, getOrCreateDefaultUser } from "@/actions/users";
import { CurrencyCode } from "@/lib/currency/fx";

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
  setPortalMode: (mode: PortalMode) => void;
  isPersonal: boolean;
  isCorporate: boolean;
  isAdmin: boolean;
  isEnterprise: boolean;
  setCurrentCurrency: (currency: CurrencyCode) => void;
  switchUser: (userId: string) => void;
  refreshUserData: () => Promise<void>;
  updateUserBalance: (newBalance: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCurrency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [portalMode, setPortalModeState] = useState<PortalMode>("PERSONAL");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCurrency = localStorage.getItem("loyalty_currency") as CurrencyCode | null;
      if (savedCurrency) setCurrencyState(savedCurrency);

      const savedMode = localStorage.getItem("loyalty_portal_mode") as PortalMode | null;
      if (savedMode) {
        if (savedMode === "GENERAL") setPortalModeState("PERSONAL");
        else if (savedMode === "ENTERPRISE") setPortalModeState("CORPORATE");
        else setPortalModeState(savedMode);
      }
    }
  }, []);

  const setPortalMode = (mode: PortalMode) => {
    const normalized = mode === "GENERAL" ? "PERSONAL" : mode === "ENTERPRISE" ? "CORPORATE" : mode;
    setPortalModeState(normalized);
    if (typeof window !== "undefined") {
      localStorage.setItem("loyalty_portal_mode", normalized);
    }
  };

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

        const savedMode = typeof window !== "undefined" ? localStorage.getItem("loyalty_portal_mode") as PortalMode | null : null;
        if (savedMode) {
          if (savedMode === "GENERAL") setPortalModeState("PERSONAL");
          else if (savedMode === "ENTERPRISE") setPortalModeState("CORPORATE");
          else setPortalModeState(savedMode);
        } else {
          const isEnt = active.role === "ADMIN" || active.email.includes("corp") || active.email.includes("admin");
          setPortalModeState(isEnt ? "CORPORATE" : "PERSONAL");
        }
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
      const isEnt = found.role === "ADMIN" || found.email.includes("corp") || found.email.includes("admin");
      const nextMode: PortalMode = isEnt ? "CORPORATE" : "PERSONAL";
      setPortalModeState(nextMode);
      if (typeof window !== "undefined") {
        localStorage.setItem("loyalty_active_user_id", userId);
        localStorage.setItem("loyalty_portal_mode", nextMode);
      }
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

  const isCorporate = portalMode === "CORPORATE" || portalMode === "ENTERPRISE";
  const isAdmin = portalMode === "ADMIN";
  const isPersonal = !isCorporate && !isAdmin;
  const isEnterprise = isCorporate;

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        loading,
        currentCurrency,
        portalMode,
        setPortalMode,
        isPersonal,
        isCorporate,
        isAdmin,
        isEnterprise,
        setCurrentCurrency,
        switchUser,
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

