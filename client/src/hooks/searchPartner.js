import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:4000";

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    if (!socket) {
      const newSocket = io(SERVER_URL, {
        reconnection: false, // Prevent duplicate connections
      });

      newSocket.on("partner_found", (partnerId) => {
        setPartner(partnerId);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [socket]);

  const findPartner = () => {
    if (socket) {
      socket.emit("find_partner");
    }
  };

  return { partner, findPartner };
};
