"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useSocket } from "@/lib/socket";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, WifiOff, Wifi, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ChatRoom() {
  const { roomId } = useParams();
  const { socket, isReady } = useSocket();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [userStatus, setUserStatus] = useState("online");

  useEffect(() => {
    if (!roomId || !isReady) return;

    const fetchConversation = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/conversation/${roomId}`,
          { credentials: "include" }
        );

        if (!res.ok) throw new Error("Conversation not found");

        const data = await res.json();
        setConversation(data.conversation);
        setMessages(data.conversation.messages || []);
        socket.emit("join", roomId);

        if (data.conversation.user1?.id && data.conversation.user2?.id) {
          socket.emit(
            "getOnlineStatus",
            [data.conversation.user1.id, data.conversation.user2.id],
            (statusMap) => {
              const onlineSet = new Set();
              Object.entries(statusMap).forEach(([userId, isOnline]) => {
                if (isOnline) onlineSet.add(userId);
              });
              setOnlineUsers(onlineSet);
            }
          );
        }
      } catch (err) {
        setError("Could not load the conversation.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [roomId, isReady, socket]);

  useEffect(() => {
    if (!isReady || !socket || !roomId) return;

    const onMessageReceive = (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });

      if (msg.senderId === typingUser?.userId) {
        setTypingUser(null);
      }
    };

    const onUserTyping = (user) => {
      setTypingUser(user);
    };

    const onUserStoppedTyping = (user) => {
      setTypingUser((current) =>
        current?.userId === user.userId ? null : current
      );
    };

    const onPartnerDisconnected = (user) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          content: `${user.username} has disconnected`,
          isSystem: true,
          createdAt: new Date().toISOString(),
        },
      ]);

      if (typingUser?.userId === user.userId) {
        setTypingUser(null);
      }
    };

    const onUserOnline = (user) => {
      setOnlineUsers((prev) => new Set(prev).add(user.userId));

      if (
        conversation?.user1?.id === user.userId ||
        conversation?.user2?.id === user.userId
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-online-${Date.now()}`,
            content: `${user.username} is now online`,
            isSystem: true,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    };

    const onUserOffline = (user) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.userId);
        return newSet;
      });

      if (
        conversation?.user1?.id === user.userId ||
        conversation?.user2?.id === user.userId
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-offline-${Date.now()}`,
            content: `${user.username} went offline`,
            isSystem: true,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    };

    const onError = (msg) => {
      setError(msg);
    };

    socket.on("message:receive", onMessageReceive);
    socket.on("user:typing", onUserTyping);
    socket.on("user:stoppedTyping", onUserStoppedTyping);
    socket.on("partnerDisconnected", onPartnerDisconnected);
    socket.on("user:online", onUserOnline);
    socket.on("user:offline", onUserOffline);
    socket.on("error", onError);

    return () => {
      socket.off("message:receive", onMessageReceive);
      socket.off("user:typing", onUserTyping);
      socket.off("user:stoppedTyping", onUserStoppedTyping);
      socket.off("partnerDisconnected", onPartnerDisconnected);
      socket.off("user:online", onUserOnline);
      socket.off("user:offline", onUserOffline);
      socket.off("error", onError);
    };
  }, [isReady, roomId, socket, typingUser, conversation]);

  const toggleOnlineStatus = useCallback(() => {
    if (!socket || !isReady) return;

    const newStatus = userStatus === "online" ? "offline" : "online";
    socket.emit("user:setStatus", newStatus);
    setUserStatus(newStatus);
  }, [socket, isReady, userStatus]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = useCallback(() => {
    if (!newMessage.trim() || !roomId || !isReady || !socket) return;

    socket.emit("message:send", {
      roomId,
      content: newMessage.trim(),
      type: "TEXT",
    });

    setNewMessage("");
    handleStopTyping();
  }, [newMessage, roomId, isReady, socket]);

  const handleImageUpload = useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (!file || !roomId || !isReady || !socket) return;

      event.target.value = "";

      try {
        setIsUploading(true);

        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
          {
            method: "POST",
            body: formData,
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const { url, fileId } = await response.json();

        socket.emit("message:send", {
          roomId,
          content: url,
          imageId: fileId,
          type: "IMAGE",
        });
      } catch (err) {
        setError("Failed to upload image: " + err.message);
      } finally {
        setIsUploading(false);
      }
    },
    [roomId, isReady, socket]
  );

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleTyping = useCallback(() => {
    if (!isReady || !socket || !roomId) return;

    socket.emit("typing:start");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  }, [isReady, roomId, socket]);

  const handleStopTyping = useCallback(() => {
    if (!isReady || !socket || !roomId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
    socket.emit("typing:stop");
  }, [isReady, roomId, socket]);

  const handleInputChange = useCallback(
    (e) => {
      setNewMessage(e.target.value);

      if (e.target.value.trim()) {
        handleTyping();
      } else {
        handleStopTyping();
      }
    },
    [handleTyping, handleStopTyping]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.has(userId);
    },
    [onlineUsers]
  );

  const renderMessage = (msg, sender) => {
    if (msg.isSystem) {
      return (
        <div key={msg.id} className="flex justify-center">
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {msg.content}
          </span>
        </div>
      );
    }

    return (
      <div key={msg.id} className="flex items-start gap-3">
        <Avatar className="h-8 w-8 relative">
          {sender.avatar ? (
            <AvatarImage src={sender.avatar} alt={sender.name} />
          ) : (
            <AvatarFallback className="text-xs">
              {sender.name[0]}
            </AvatarFallback>
          )}
          <span
            className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${
              isUserOnline(sender.id) ? "bg-green-500" : "bg-gray-500"
            } ring-1 ring-white`}
          />
        </Avatar>
        <div className="space-y-1">
          <p className="text-sm font-medium flex items-center gap-1">
            {sender.name}
            {isUserOnline(sender.id) && (
              <span className="text-xs text-green-500">•</span>
            )}
          </p>
          <div className="bg-secondary p-3 rounded-lg text-sm max-w-[300px]">
            {msg.type === "IMAGE" ? (
              <div className="relative">
                <img
                  src={msg.content}
                  alt="Shared image"
                  className="rounded object-cover w-full"
                  onLoad={scrollToBottom}
                />
              </div>
            ) : (
              msg.content
            )}
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center text-red-500">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <Skeleton className="h-8 w-1/2 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8 dark">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-center flex-1">
            {conversation?.user1?.name} & {conversation?.user2?.name}
          </CardTitle>
          <Button
            variant={userStatus === "online" ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
            onClick={toggleOnlineStatus}
          >
            {userStatus === "online" ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            {userStatus === "online" ? "Online" : "Offline"}
          </Button>
        </div>

        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <span>{conversation?.user1?.name}:</span>
            <Badge
              variant={
                isUserOnline(conversation?.user1?.id) ? "success" : "secondary"
              }
            >
              {isUserOnline(conversation?.user1?.id) ? "Online" : "Offline"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span>{conversation?.user2?.name}:</span>
            <Badge
              variant={
                isUserOnline(conversation?.user2?.id) ? "success" : "secondary"
              }
            >
              {isUserOnline(conversation?.user2?.id) ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96 px-4">
          <div className="space-y-4 py-4">
            {messages.map((msg) => {
              if (!msg) return null;

              if (msg.isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              const sender =
                msg.senderId === conversation.user1.id
                  ? conversation.user1
                  : conversation.user2;

              return renderMessage(msg, sender);
            })}

            {/* Typing indicator */}
            {typingUser && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1 items-center">
                  <span>{typingUser.username} is typing</span>
                  <span className="flex">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </span>
                </div>
              </div>
            )}

            {/* Image uploading indicator */}
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1 items-center">
                  <span>Uploading image</span>
                  <span className="flex">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="pt-4 pb-6">
        <div className="flex w-full items-center gap-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={!isReady || isUploading}
          />

          {/* Image upload button */}
          <Button
            onClick={handleImageButtonClick}
            size="icon"
            variant="outline"
            disabled={!isReady || isUploading}
            title="Send an image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleStopTyping}
            className="flex-1"
            disabled={isUploading}
          />
          <Button
            onClick={handleSend}
            size="icon"
            disabled={!newMessage.trim() || !isReady || isUploading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
