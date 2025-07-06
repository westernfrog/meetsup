"use client";

import { useEffect, useState, useContext, useRef } from "react";
import { useParams, usePathname } from "next/navigation";
import { useSocket } from "../../../lib/socket";
import { useAuth } from "../../../contexts/AuthContext";
import Chats from "../components/Chats.jsx";
import MessageInput from "../components/MessageInput.jsx";
import FriendHeader from "../components/FriendHeader.jsx";

export default function Room() {
  const pathname = usePathname();
  const roomId = pathname.split("/").filter(Boolean).pop();
  const { socket, isReady, connectionError } = useSocket();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  console.log(roomId);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${roomId}`,
          { credentials: "include" }
        );

        const data = await response.json();
        setConversation(data);
        console.log(data);

        setMessages(data.conversation.messages);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching conversation:", err);
      } finally {
        setLoading(false);
      }
    };

    if (roomId && !authLoading) {
      fetchConversation();
    }
  }, [roomId, currentUser, authLoading]);

  console.log(conversation);

  useEffect(() => {
    if (isReady && socket && roomId) {
      socket.emit("join", roomId);

      socket.on("joinSuccess", ({ roomId }) => {
        console.log(`Joined room: ${roomId}`);
      });

      socket.on("message:receive", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      socket.on("user:typing", ({ userId }) => {
        setTypingUsers((prevTypingUsers) => {
          if (!prevTypingUsers.includes(userId)) {
            return [...prevTypingUsers, userId];
          }
          return prevTypingUsers;
        });
      });

      socket.on("user:stoppedTyping", ({ userId }) => {
        setTypingUsers((prevTypingUsers) =>
          prevTypingUsers.filter((id) => id !== userId)
        );
      });

      socket.on("partnerDisconnected", () => {
        console.log("Partner disconnected from the room.");
        // Optionally show a message to the user
      });

      socket.on("error", (errorMessage) => {
        console.error("Socket error:", errorMessage);
        setError(errorMessage);
      });

      return () => {
        socket.off("joinSuccess");
        socket.off("message:receive");
        socket.off("user:typing");
        socket.off("user:stoppedTyping");
        socket.off("partnerDisconnected");
        socket.off("error");
      };
    }
  }, [isReady, socket, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const handleSendMessage = (content) => {
    if (socket && roomId && content.trim()) {
      const newMessage = {
        conversationId: roomId,
        senderId: currentUser.id, // Assuming currentUser has an 'id' field
        content,
        type: "text",
        createdAt: new Date().toISOString(), // Optimistic update
        sender: {
          id: currentUser.id,
          name: currentUser.name, // Assuming currentUser has a 'name' field
          profilePics: currentUser.profilePics, // Assuming currentUser has 'profilePics'
        },
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      socket.emit("message:send", { roomId, content, type: "text" });
    }
  };

  const handleStartTyping = () => {
    if (socket && roomId) {
      socket.emit("typing:start", { roomId });
    }
  };

  const handleStopTyping = () => {
    if (socket && roomId) {
      socket.emit("typing:stop", { roomId });
    }
  };

  return (
    <>
      <div className="grid grid-cols-12 grid-rows-12 h-full">
        <div className="col-span-12 row-span-12 flex flex-col h-full">
          {/* {otherUser && <FriendHeader data={otherUser} />} */}
          <Chats
            messages={messages}
            currentUser={currentUser}
            typingUsers={typingUsers}
            messagesEndRef={messagesEndRef}
          />
          <MessageInput
            onSendMessage={handleSendMessage}
            onStartTyping={handleStartTyping}
            onStopTyping={handleStopTyping}
          />
        </div>
      </div>
    </>
  );
}
