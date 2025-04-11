"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

export function useSocket() {
  const [isReady, setIsReady] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const auth = getAuth();

    const init = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };

    init();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(true);

          if (!token) return;

          const socket = io(process.env.NEXT_PUBLIC_API_URL, {
            auth: { token },
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
          });

          socketRef.current = socket;

          socket.on("connect", () => {
            setIsReady(true);
          });
        } catch (err) {
          console.error("Socket connection error:", err);
        }
      }
    });

    return () => {
      unsubscribe();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socket: socketRef.current, isReady };
}
