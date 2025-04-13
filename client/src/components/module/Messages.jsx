"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Settings,
  Search,
  SortDesc,
  SortAsc,
  Check,
  X,
  Image,
  Calendar,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data based on the schema
const mockUsers = [
  {
    id: "1",
    fId: "user1",
    name: "John Doe",
    age: 25,
    gender: "MALE",
    profilePics: JSON.stringify(["/avatars/john.jpg"]),
  },
  {
    id: "2",
    fId: "user2",
    name: "Jane Smith",
    age: 28,
    gender: "FEMALE",
    profilePics: JSON.stringify(["/avatars/jane.jpg"]),
  },
  {
    id: "3",
    fId: "user3",
    name: "Alex Johnson",
    age: 32,
    gender: "OTHER",
    profilePics: JSON.stringify(["/avatars/alex.jpg"]),
  },
];

const mockConversations = [
  {
    id: "conv1",
    user1Id: "1",
    user2Id: "2",
    type: "INSTANT",
    createdAt: new Date(2025, 3, 10),
    updatedAt: new Date(2025, 3, 13, 10, 30),
  },
  {
    id: "conv2",
    user1Id: "1",
    user2Id: "3",
    type: "FOCUSED",
    createdAt: new Date(2025, 3, 5),
    updatedAt: new Date(2025, 3, 12, 15, 45),
  },
  {
    id: "conv3",
    user1Id: "3",
    user2Id: "2",
    type: "INSTANT",
    createdAt: new Date(2025, 3, 1),
    updatedAt: new Date(2025, 3, 11, 8, 20),
  },
];

const mockMessages = [
  {
    id: "msg1",
    conversationId: "conv1",
    senderId: "2",
    type: "TEXT",
    content: "Hey, how are you doing today?",
    createdAt: new Date(2025, 3, 13, 10, 30),
  },
  {
    id: "msg2",
    conversationId: "conv2",
    senderId: "3",
    type: "TEXT",
    content: "Did you see that new movie?",
    createdAt: new Date(2025, 3, 12, 15, 45),
  },
  {
    id: "msg3",
    conversationId: "conv3",
    senderId: "2",
    type: "IMAGE",
    imageId: "img123",
    content: "Check out this photo!",
    createdAt: new Date(2025, 3, 11, 8, 20),
  },
];

// Mock requests - conversation requests pending approval
const mockRequests = [
  {
    id: "req1",
    user: mockUsers[1],
    message: "Hi! I'd like to connect with you.",
    createdAt: new Date(2025, 3, 13, 9, 15),
  },
  {
    id: "req2",
    user: mockUsers[2],
    message: "Hello there! Can we chat?",
    createdAt: new Date(2025, 3, 12, 14, 30),
  },
];

const formatMessageDate = (date) => {
  const now = new Date();
  const messageDate = new Date(date);

  // Same day
  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Within last week
  const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    const options = { weekday: "short" };
    return messageDate.toLocaleDateString(undefined, options);
  }

  // Otherwise
  return messageDate.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activeTab, setActiveTab] = useState("chats");
  const [settings, setSettings] = useState({
    blurImages: true,
    allowImageRequests: false,
  });

  // Get conversations with the last message and other user details
  const getEnrichedConversations = () => {
    const currentUserId = "1"; // Assuming logged in user is id 1

    return mockConversations.map((conv) => {
      const otherUserId =
        conv.user1Id === currentUserId ? conv.user2Id : conv.user1Id;
      const otherUser = mockUsers.find((user) => user.id === otherUserId);

      const lastMessage = mockMessages
        .filter((msg) => msg.conversationId === conv.id)
        .sort((a, b) => b.createdAt - a.createdAt)[0];

      return {
        ...conv,
        otherUser,
        lastMessage,
      };
    });
  };

  // Sort and filter conversations
  const getSortedFilteredConversations = () => {
    const enriched = getEnrichedConversations();

    // Filter based on search query
    const filtered = searchQuery
      ? enriched.filter(
          (conv) =>
            conv.otherUser.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            (conv.lastMessage?.content &&
              conv.lastMessage.content
                .toLowerCase()
                .includes(searchQuery.toLowerCase()))
        )
      : enriched;

    // Sort by last message date
    return filtered.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || a.updatedAt;
      const dateB = b.lastMessage?.createdAt || b.updatedAt;
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  };

  const conversations = getSortedFilteredConversations();

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  return (
    <div className="grid grid-cols-16 grid-rows-22 h-full w-full divide-y">
      <div className="col-span-16 row-span-2 flex items-center px-6">
        <div className="flex items-center justify-between w-full gap-2">
          <h2 className="text-lg">Messages</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Message Settings</DialogTitle>
                <DialogDescription>
                  Customize your messaging experience
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="blur-images">Blur images</Label>
                    <p className="text-sm text-muted-foreground">
                      Blur images until you hover over them
                    </p>
                  </div>
                  <Switch
                    id="blur-images"
                    checked={settings.blurImages}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, blurImages: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-images">Allow image requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Let people send you images in initial messages
                    </p>
                  </div>
                  <Switch
                    id="allow-images"
                    checked={settings.allowImageRequests}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, allowImageRequests: checked })
                    }
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="col-span-16 row-span-2 flex items-center gap-2 px-6 border-b">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSortOrder}
          title={sortOrder === "desc" ? "Newest first" : "Oldest first"}
        >
          {sortOrder === "desc" ? (
            <SortDesc className="h-4 w-4" />
          ) : (
            <SortAsc className="h-4 w-4" />
          )}
        </Button>
      </div>
      <Tabs
        defaultValue="chats"
        className="flex-grow flex flex-col col-span-16 row-span-20"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-2 mt-3 mx-6 w-full">
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {mockRequests.length > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 min-w-5 flex items-center justify-center rounded-full text-xs"
              >
                {mockRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="flex-grow flex flex-col pt-2">
          <ScrollArea className="flex-grow">
            <div className="space-y-4">
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    className="w-full text-left flex items-center gap-3 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={JSON.parse(conv.otherUser.profilePics)[0] || ""}
                          alt={conv.otherUser.name}
                        />
                        <AvatarFallback>
                          {conv.otherUser.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {conv.otherUser.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {conv.lastMessage
                            ? formatMessageDate(conv.lastMessage.createdAt)
                            : formatMessageDate(conv.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                        {conv.lastMessage?.type === "IMAGE" && (
                          <Image className="h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <span className="truncate">
                          {conv.lastMessage?.content || "Start chatting now"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No conversations found</p>
                  {searchQuery && (
                    <p className="text-sm mt-1">Try adjusting your search</p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="requests" className="flex-grow flex flex-col pt-2">
          <ScrollArea className="flex-grow">
            <div className="px-4 space-y-3">
              {mockRequests.length > 0 ? (
                mockRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 bg-card"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={JSON.parse(request.user.profilePics)[0] || ""}
                          alt={request.user.name}
                        />
                        <AvatarFallback>
                          {request.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="font-medium">{request.user.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {request.user.age} •{" "}
                          {request.user.gender === "MALE"
                            ? "Male"
                            : request.user.gender === "FEMALE"
                            ? "Female"
                            : "Other"}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm mb-4">{request.message}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatMessageDate(request.createdAt)}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive">
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                        <Button size="sm">
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No pending requests</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
