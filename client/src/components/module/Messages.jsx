"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthProvider";
import { useSocket } from "@/lib/socket";
import { Search, MessageSquare, MailQuestion, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { socket, isReady } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [deletingConversation, setDeletingConversation] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    enabled: !!user,
    refetchInterval: 2000,
    staleTime: 5000,
  });

  // Handle delete conversation
  const handleDeleteConversation = async () => {
    if (!deletingConversation) return;

    try {
      setIsDeleting(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${deletingConversation}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete conversation");
      }

      // Update the cache by removing the deleted conversation
      queryClient.setQueryData(["conversations"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((c) => c.id !== deletingConversation);
      });

      toast.success("Conversation deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete conversation");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeletingConversation(null);
    }
  };

  // Setup socket connection for real-time updates
  useEffect(() => {
    if (!user || !isReady || !socket || !conversations) return;

    // Collect all user IDs from conversations
    const userIds = conversations
      .flatMap((conversation) => [conversation.user1Id, conversation.user2Id])
      .filter((id) => id !== user.id);

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

  // Helper functions
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

  // Filter conversations based on search query and type
  const filteredConversations = conversations
    ? conversations.filter((conversation) => {
        // Filter by search query if present
        const matchesSearch = searchQuery
          ? getPartnerName(conversation)
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          : true;

        // Filter by conversation type (focused or instant)
        const isRequest =
          conversation.type === "INSTANT" || conversation.isRequest;

        if (activeTab === "chats") {
          return matchesSearch && !isRequest;
        } else {
          // Requests tab
          return matchesSearch && isRequest;
        }
      })
    : [];

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

  return (
    <div className="container max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
        <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="chats"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chats" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chats
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <MailQuestion className="h-4 w-4" />
            Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="mt-4">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No focused chats yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  getPartnerName={getPartnerName}
                  getPartnerId={getPartnerId}
                  getPartnerAvatar={getPartnerAvatar}
                  getInitials={getInitials}
                  isUserOnline={isUserOnline}
                  onDeleteClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeletingConversation(conversation.id);
                    setIsDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No chat requests.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-auto max-h-[400px]">
              {filteredConversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  getPartnerName={getPartnerName}
                  getPartnerId={getPartnerId}
                  getPartnerAvatar={getPartnerAvatar}
                  getInitials={getInitials}
                  isUserOnline={isUserOnline}
                  onDeleteClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeletingConversation(conversation.id);
                    setIsDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Extracted ConversationCard component with delete button
function ConversationCard({
  conversation,
  getPartnerName,
  getPartnerId,
  getPartnerAvatar,
  getInitials,
  isUserOnline,
  onDeleteClick,
}) {
  return (
    <Link href={`/c/${conversation.id}`} className="block overflow-auto">
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
                <div className="flex items-center gap-2">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    onClick={onDeleteClick}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="text-sm text-muted-foreground truncate max-w-[70%]">
                  {conversation.messages?.[0]?.content || "No messages yet"}
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
  );
}
