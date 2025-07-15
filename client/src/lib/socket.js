"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

export function useSocket() {
  const [isReady, setIsReady] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const socketRef = useRef(null);
  const authInitialized = useRef(false);

  useEffect(() => {
    const auth = getAuth();

    const init = async () => {
      if (authInitialized.current) return;

      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        authInitialized.current = true;
      } catch (err) {
        console.error("Auth error:", err);
        setIsUnauthorized(true);
      }
    };

    init();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up existing socket if it exists
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsReady(false);
      }

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(true);

          if (!token) {
            console.error("No token received");
            setIsUnauthorized(true);
            return;
          }

          console.log("Connecting to socket with token");
          const socket = io(process.env.NEXT_PUBLIC_API_URL, {
            auth: { token },
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            transports: ["websocket", "polling"], // Ensure fallback transport
          });

          socketRef.current = socket;

          socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            setIsReady(true);
            setIsUnauthorized(false);
          });

          socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
            setIsReady(false);
            if (
              reason === "io server disconnect" ||
              reason === "io client disconnect"
            ) {
              return;
            }
          });

          socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error.message);
            setIsReady(false);
            if (error.message.includes("unauthorized")) {
              setIsUnauthorized(true);
            }
          });

          socket.on("error", (error) => {
            console.error("Socket error:", error);
            setIsReady(false);
          });

          // Add reconnection success handler
          socket.on("reconnect", () => {
            console.log("Socket reconnected");
            setIsReady(true);
          });
        } catch (err) {
          console.error("Socket initialization error:", err);
          setIsUnauthorized(true);
        }
      } else {
        setIsReady(false);
        setIsUnauthorized(true);
      }
    });

    return () => {
      unsubscribe();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsReady(false);
    };
  }, []); // Remove dependencies to prevent recreation

  return {
    socket: socketRef.current,
    isReady,
    isUnauthorized,
  };
}
