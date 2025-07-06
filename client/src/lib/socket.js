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

          if (!token) {
            return;
          }

          const socket = io(process.env.NEXT_PUBLIC_API_URL, {
            auth: { token },
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
          });

          socketRef.current = socket;

          socket.on("connect", () => {
            setIsReady(true);
          });

          socket.on("disconnect", (reason) => {
            setIsReady(false);
            if (
              reason === "io server disconnect" ||
              reason === "io client disconnect"
            ) {
              // Manual disconnect or server-side disconnect, don't auto-reconnect
              return;
            }
          });

          socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error.message);
            setIsReady(false);
          });

          socket.on("error", (error) => {
            console.error("Socket error:", error);
            setIsReady(false);
          });
        } catch (err) {
          console.error("Socket initialization error:", err);
        }
      } else {
        setIsReady(false);
      }
    });

    return () => {
      unsubscribe();
      // Check if socketRef.current exists before trying to disconnect
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsReady(false);
    };
  }, []);

  return {
    socket: socketRef.current,
    isReady,
  };
}
