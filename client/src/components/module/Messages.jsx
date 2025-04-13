"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthProvider";
import { useSocket } from "@/lib/socket"; // Import the socket hook

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // Change to Set for consistency with ChatRoom
  const { socket, isReady } = useSocket(); // Use the socket hook like in ChatRoom

  // Fetch conversations using TanStack Query
  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations`,
        { credentials: "include" }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await res.json();
      return data.conversations.sort(
        (a, b) =>
          new Date(b.messages?.[0]?.createdAt ?? 0).getTime() -
          new Date(a.messages?.[0]?.createdAt ?? 0).getTime()
      );
    },
    enabled: !!user, // Only run query if user is logged in
    refetchInterval: 2000, // Refetch every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Setup socket connection for real-time updates
  useEffect(() => {
    if (!user || !isReady || !socket || !conversations) return;

    // Collect all user IDs from conversations
    const userIds = conversations
      .flatMap((conversation) => [conversation.user1Id, conversation.user2Id])
      .filter((id) => id !== user.id); // Filter out current user

    // Get unique user IDs
    const uniqueUserIds = [...new Set(userIds)];

    // Check online status of all users in conversations
    socket.emit("getOnlineStatus", uniqueUserIds, (statusMap) => {
      const onlineSet = new Set();
      Object.entries(statusMap).forEach(([userId, isOnline]) => {
        if (isOnline) onlineSet.add(userId);
      });
      setOnlineUsers(onlineSet);
    });

    // Listen for online status changes
    const onUserOnline = (user) => {
      setOnlineUsers((prev) => new Set(prev).add(user.userId));
    };

    const onUserOffline = (user) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.userId);
        return newSet;
      });
    };

    // Listen for new messages
    const onMessageReceive = (message) => {
      // Update the cached data when new messages arrive
      queryClient.setQueryData(["conversations"], (oldData) => {
        if (!oldData) return oldData;

        // Find the conversation this message belongs to
        const updatedConversations = [...oldData];
        const conversationIndex = updatedConversations.findIndex(
          (c) => c.id === message.conversationId
        );

        if (conversationIndex !== -1) {
          // Add the message to the beginning of the messages array
          const conversation = { ...updatedConversations[conversationIndex] };
          conversation.messages = [message, ...(conversation.messages || [])];

          // Update the conversation
          updatedConversations[conversationIndex] = conversation;

          // Sort conversations by most recent message
          return updatedConversations.sort(
            (a, b) =>
              new Date(b.messages?.[0]?.createdAt ?? 0).getTime() -
              new Date(a.messages?.[0]?.createdAt ?? 0).getTime()
          );
        }

        return oldData;
      });
    };

    // Register event listeners
    socket.on("user:online", onUserOnline);
    socket.on("user:offline", onUserOffline);
    socket.on("message:receive", onMessageReceive);

    return () => {
      // Clean up event listeners
      socket.off("user:online", onUserOnline);
      socket.off("user:offline", onUserOffline);
      socket.off("message:receive", onMessageReceive);
    };
  }, [user, queryClient, socket, isReady, conversations]);

  // For loading state
  if (isLoading || !user) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // For error state
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Error loading conversations</p>
        <button
          onClick={() => queryClient.invalidateQueries(["conversations"])}
          className="mt-2 px-4 py-2 bg-muted rounded-md text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  const getPartnerName = (conversation) => {
    return user?.id === conversation.user1Id
      ? conversation.user2?.name
      : conversation.user1?.name;
  };

  const getPartnerId = (conversation) => {
    return user?.id === conversation.user1Id
      ? conversation.user2Id
      : conversation.user1Id;
  };

  const getPartnerAvatar = (conversation) => {
    const partner =
      user?.id === conversation.user1Id
        ? conversation.user2
        : conversation.user1;

    return partner?.profilePics?.[0]?.url || null;
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2) || "??"
    );
  };

  // Check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  return (
    <div className="container max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {!conversations || conversations.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No conversations yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/c/${conversation.id}`}
              className="block"
            >
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="relative">
                      <Avatar className="h-12 w-12 mr-4">
                        {getPartnerAvatar(conversation) ? (
                          <AvatarImage src={getPartnerAvatar(conversation)} />
                        ) : (
                          <AvatarFallback>
                            {getInitials(getPartnerName(conversation))}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {/* Online status indicator on avatar */}
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${
                          isUserOnline(getPartnerId(conversation))
                            ? "bg-green-500"
                            : "bg-gray-500"
                        } ring-1 ring-white`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium truncate flex items-center gap-1">
                          {getPartnerName(conversation)}
                          {isUserOnline(getPartnerId(conversation)) && (
                            <span className="text-xs text-green-500">•</span>
                          )}
                        </div>
                        {conversation.messages?.[0]?.createdAt && (
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(conversation.messages[0].createdAt),
                              {
                                addSuffix: true,
                              }
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="text-sm text-muted-foreground truncate max-w-[70%]">
                          {conversation.messages?.[0]?.content ||
                            "No messages yet"}
                        </div>

                        <div className="flex items-center">
                          {isUserOnline(getPartnerId(conversation)) && (
                            <Badge
                              variant="outline"
                              className="rounded-full gap-1 px-2 py-0.5 text-xs border-green-500 text-green-600"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                              Online
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
