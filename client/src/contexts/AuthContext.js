"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signOut,
} from "firebase/auth";
import app from "@/lib/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/anonymous`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              credentials: "include",
            }
          );

          if (response.ok) {
            const { user } = await response.json();
            setUser(user);
          } else {
            console.warn("Server rejected token");
            setUser(null);
          }
        } catch (error) {
          console.error("Authentication error:", error);
          setUser(null);
        }
      } else {
        // If no firebaseUser, try to fetch user from session cookie
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (response.ok) {
            const { user } = await response.json();
            setUser(user);
          } else {
            // If /auth/me fails (e.g., 401, 403, 404), it means no valid session
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user from session:", error);
          setUser(null);
        }
      } 
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAnonymously = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Anonymous login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loginAnonymously, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
