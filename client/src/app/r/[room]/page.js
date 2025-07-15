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
  const { socket, isReady, isUnauthorized } = useSocket();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [roomJoined, setRoomJoined] = useState(false);
  const [otherUser, setOtherUser] = useState(null);

  // Fetch conversation data
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
        setConversation(data.conversation);
        setMessages(data?.conversation?.messages);

        // Determine which user is the "other" user
        if (data.conversation && currentUser) {
          const isUser1 = data.conversation.user1Id === currentUser.id;
          const isUser2 = data.conversation.user2Id === currentUser.id;

          if (isUser1) {
            // Current user is user1, so other user is user2
            setOtherUser(data.conversation.user2);
          } else if (isUser2) {
            // Current user is user2, so other user is user1
            setOtherUser(data.conversation.user1);
          } else {
            // Current user is neither user1 nor user2 - unauthorized
            setError("Unauthorized to view this conversation");
            setConversation(null);
          }
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching conversation:", err);
      } finally {
        setLoading(false);
      }
    };

    if (roomId && !authLoading && currentUser) {
      fetchConversation();
    }
  }, [roomId, currentUser, authLoading]);

  // Join socket room after conversation is fetched and socket is ready
  useEffect(() => {
    if (!socket || !isReady || !roomId || !conversation || roomJoined) return;

    console.log("Joining room:", roomId);
    socket.emit("join", roomId);

    const handleJoinSuccess = ({ roomId: joinedRoomId }) => {
      console.log("Successfully joined room:", joinedRoomId);
      setRoomJoined(true);
    };

    const handleJoinError = (error) => {
      console.error("Failed to join room:", error);
      setError("Failed to join conversation");
    };

    socket.on("joinSuccess", handleJoinSuccess);
    socket.on("error", handleJoinError);

    return () => {
      socket.off("joinSuccess", handleJoinSuccess);
      socket.off("error", handleJoinError);
    };
  }, [socket, isReady, roomId, conversation, roomJoined]);

  // Handle incoming messages and typing indicators
  useEffect(() => {
    if (!socket || !isReady || !roomJoined) return;

    const handleReceiveMessage = (message) => {
      console.log("Received message:", message);
      setMessages((prevMessages) => {
        // Check if message already exists to avoid duplicates
        const messageExists = prevMessages.some((msg) => msg.id === message.id);
        if (messageExists) {
          return prevMessages;
        }
        return [...prevMessages, message];
      });

      // Mark message as seen if it's not from the current user
      if (message.senderId !== currentUser.id) {
        socket.emit("message:seen", { messageId: message.id });
      }
    };

    const handleUserTyping = ({ userId }) => {
      setTypingUsers((prev) => {
        if (userId !== currentUser.id && !prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    };

    const handleUserStoppedTyping = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    };

    socket.on("message:receive", handleReceiveMessage);
    socket.on("user:typing", handleUserTyping);
    socket.on("user:stoppedTyping", handleUserStoppedTyping);

    return () => {
      socket.off("message:receive", handleReceiveMessage);
      socket.off("user:typing", handleUserTyping);
      socket.off("user:stoppedTyping", handleUserStoppedTyping);
    };
  }, [socket, isReady, roomJoined, currentUser]);

  const handleSendMessage = async (text, images) => {
    if (!socket || !isReady || !roomId || !roomJoined) {
      console.error("Cannot send message: socket not ready or room not joined");
      return;
    }

    let imageUrl = null;
    if (images && images.length > 0) {
      const imageFile = images[0].file;
      const formData = new FormData();
      formData.append("image", imageFile);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
          {
            method: "POST",
            body: formData,
            credentials: "include",
          }
        );
        const data = await response.json();
        if (response.ok) {
          imageUrl = data.url;
        } else {
          console.error("Image upload failed:", data.error);
          return;
        }
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return;
      }
    }

    let messageType = "TEXT";
    if (text.trim() && imageUrl) {
      messageType = "TEXT_IMAGE";
    } else if (imageUrl) {
      messageType = "IMAGE";
    }

    console.log("Sending message:", {
      roomId,
      content: text.trim(),
      type: messageType,
      imageUrl,
    });

    socket.emit("message:send", {
      roomId,
      content: text.trim(),
      type: messageType,
      imageUrl: imageUrl,
    });
  };

  console.log("Room state:", {
    roomJoined,
    isReady,
    roomId,
    messagesCount: messages.length,
    currentUserId: currentUser?.id,
    otherUser: otherUser?.id,
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Error</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-12 grid-rows-12 h-full">
        <div className="col-span-12 row-span-12 flex flex-col h-full">
          <FriendHeader data={otherUser} typingUsers={typingUsers} />
          <Chats messages={messages} currentUser={currentUser} />
          <MessageInput
            onSendMessage={handleSendMessage}
            socket={socket}
            roomId={roomId}
            currentUser={currentUser}
          />
        </div>
      </div>
    </>
  );
}
