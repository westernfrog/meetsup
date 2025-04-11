"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  MessageCircle,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Filter,
  BellRing,
  Settings,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isToday, isYesterday } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";

// Demo messages data
const demoMessages = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Sarah",
    lastMessage: "Are we still meeting tomorrow?",
    timestamp: new Date(Date.now() - 10 * 60000), // 10 minutes ago
    unread: 2,
    online: true,
    seen: true,
  },
  {
    id: "2",
    name: "David Wilson",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=David",
    lastMessage: "I sent you the files you requested",
    timestamp: new Date(Date.now() - 45 * 60000), // 45 minutes ago
    unread: 0,
    online: true,
    seen: true,
  },
  {
    id: "3",
    name: "Emily Parker",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Emily",
    lastMessage: "Looking forward to seeing you",
    timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    unread: 1,
    online: false,
    seen: false,
  },
  {
    id: "4",
    name: "Michael Brown",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Michael",
    lastMessage: "Thanks for your help with the project",
    timestamp: new Date(Date.now() - 3 * 3600000), // 3 hours ago
    unread: 0,
    online: false,
    seen: true,
  },
  {
    id: "5",
    name: "Jessica Taylor",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Jessica",
    lastMessage: "Did you watch the new episode?",
    timestamp: new Date(Date.now() - 6 * 3600000), // 6 hours ago
    unread: 0,
    online: true,
    seen: true,
  },
  {
    id: "6",
    name: "Alex Robinson",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Alex",
    lastMessage: "Let's grab lunch sometime next week",
    timestamp: new Date(Date.now() - 12 * 3600000), // 12 hours ago
    unread: 0,
    online: false,
    seen: true,
  },
  {
    id: "7",
    name: "Olivia Martinez",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Olivia",
    lastMessage: "Can you help me with this?",
    timestamp: new Date(Date.now() - 20 * 3600000), // 20 hours ago
    unread: 3,
    online: false,
    seen: false,
  },
  {
    id: "8",
    name: "Ethan Thompson",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Ethan",
    lastMessage: "Just checking in to see how you're doing",
    timestamp: new Date(Date.now() - 28 * 3600000), // 28 hours ago
    unread: 0,
    online: true,
    seen: true,
  },
  {
    id: "9",
    name: "Sophia Lee",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Sophia",
    lastMessage: "The meetup is confirmed for Friday",
    timestamp: new Date(Date.now() - 48 * 3600000), // 2 days ago
    unread: 0,
    online: false,
    seen: true,
  },
  {
    id: "10",
    name: "Daniel Garcia",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Daniel",
    lastMessage: "Here are the photos from our trip",
    timestamp: new Date(Date.now() - 96 * 3600000), // 4 days ago
    unread: 0,
    online: true,
    seen: true,
  },
];

// Demo requests data
const demoRequests = [
  {
    id: "r1",
    name: "Taylor Swift",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Taylor",
    requestMessage: "Would like to connect with you",
    timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    mutual: 5,
  },
  {
    id: "r2",
    name: "John Smith",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=John",
    requestMessage: "Sent you a project invitation",
    timestamp: new Date(Date.now() - 5 * 3600000), // 5 hours ago
    mutual: 2,
  },
  {
    id: "r3",
    name: "Lisa Anderson",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Lisa",
    requestMessage: "Wants to share documents with you",
    timestamp: new Date(Date.now() - 23 * 3600000), // 23 hours ago
    mutual: 0,
  },
  {
    id: "r4",
    name: "Robert Johnson",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Robert",
    requestMessage: "Invited you to join team Alpha",
    timestamp: new Date(Date.now() - 72 * 3600000), // 3 days ago
    mutual: 8,
  },
];

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent"); // "recent" or "unread"
  const [messages, setMessages] = useState(demoMessages);
  const [requests, setRequests] = useState(demoRequests);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeTab, setActiveTab] = useState("chats");

  // Format the timestamp for display
  const formatTimestamp = (timestamp) => {
    if (isToday(timestamp)) {
      return format(timestamp, "h:mm a");
    } else if (isYesterday(timestamp)) {
      return "Yesterday";
    } else if (new Date().getFullYear() === timestamp.getFullYear()) {
      return format(timestamp, "MMM d");
    } else {
      return format(timestamp, "MM/dd/yyyy");
    }
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter((message) =>
    message.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter requests based on search query
  const filteredRequests = requests.filter((request) =>
    request.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort messages based on sort option
  const sortedMessages = [...filteredMessages].sort((a, b) => {
    if (sortBy === "unread") {
      // Sort by unread first, then by timestamp
      if (b.unread !== a.unread) {
        return b.unread - a.unread;
      }
    }
    // Default sort by timestamp (most recent first)
    return b.timestamp - a.timestamp;
  });

  const handleSelectConversation = (id) => {
    setActiveConversation(id);
    // Mark as read when selected
    setMessages(
      messages.map((msg) => (msg.id === id ? { ...msg, unread: 0 } : msg))
    );
  };

  const handleAcceptRequest = (id) => {
    // Remove from requests and add to messages
    const acceptedRequest = requests.find((req) => req.id === id);
    if (acceptedRequest) {
      const newMessage = {
        id: acceptedRequest.id,
        name: acceptedRequest.name,
        avatar: acceptedRequest.avatar,
        lastMessage: "Connection accepted",
        timestamp: new Date(),
        unread: 0,
        online: false,
        seen: true,
      };

      setMessages([newMessage, ...messages]);
      setRequests(requests.filter((req) => req.id !== id));
    }
  };

  const handleDeclineRequest = (id) => {
    setRequests(requests.filter((req) => req.id !== id));
  };

  // Calculate total unread count for badge
  const totalUnread = messages.reduce((sum, msg) => sum + msg.unread, 0);

  return (
    <div className="flex flex-col bg-background h-screen max-w-md mx-auto shadow-lg rounded-xl overflow-hidden border">
      {/* Main Header */}
      <div className="p-4 border-b bg-card flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://api.dicebear.com/7.x/micah/svg?seed=You" />
            <AvatarFallback>YU</AvatarFallback>
          </Avatar>
          <h1 className="font-semibold text-lg">Messages</h1>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                >
                  <Settings size={18} className="text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                >
                  <User size={18} className="text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Profile</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="chats"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="border-b px-4 pt-2 bg-card">
          <TabsList className="w-full grid grid-cols-2 h-10 rounded-lg">
            <TabsTrigger
              value="chats"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Chats
              {totalUnread > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 rounded-full bg-primary-foreground text-primary"
                >
                  {totalUnread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Requests
              {requests.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 rounded-full bg-primary-foreground text-primary"
                >
                  {requests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Search and Filters */}
        <div className="p-3 border-b bg-card/50">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 h-9 bg-background/70 border-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs flex items-center gap-1 h-8 text-muted-foreground hover:text-foreground"
              >
                <Filter size={12} />
                Filter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs flex items-center gap-1 h-8 text-muted-foreground hover:text-foreground"
                onClick={() =>
                  setSortBy(sortBy === "recent" ? "unread" : "recent")
                }
              >
                <Clock size={12} />
                {sortBy === "recent" ? "Recent" : "Unread"}
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-full"
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>

        {/* Chats Tab Content */}
        <TabsContent value="chats" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-[calc(100vh-13.5rem)]">
            {sortedMessages.length > 0 ? (
              <div className="divide-y">
                {sortedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`px-4 py-3 hover:bg-accent/40 transition-colors cursor-pointer flex items-center gap-3 ${
                      activeConversation === message.id
                        ? "bg-accent/70 hover:bg-accent/70"
                        : message.unread > 0
                        ? "bg-accent/10"
                        : ""
                    }`}
                    onClick={() => handleSelectConversation(message.id)}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={message.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {message.name.charAt(0) +
                            message.name.split(" ")[1]?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {message.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-background"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`truncate ${
                            message.unread > 0 ? "font-semibold" : "font-medium"
                          }`}
                        >
                          {message.name}
                        </h3>
                        <span
                          className={`text-xs whitespace-nowrap ml-2 ${
                            message.unread > 0
                              ? "text-foreground font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p
                          className={`text-sm truncate flex-1 ${
                            message.unread > 0
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {message.seen &&
                            message.lastMessage.startsWith("I sent") && (
                              <CheckCheck
                                size={12}
                                className="inline-block mr-1 text-primary"
                              />
                            )}
                          {message.seen &&
                            !message.lastMessage.startsWith("I sent") && (
                              <Check
                                size={12}
                                className="inline-block mr-1 text-muted-foreground"
                              />
                            )}
                          {message.lastMessage}
                        </p>
                        {message.unread > 0 && (
                          <Badge
                            variant="default"
                            className="rounded-full h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-primary"
                          >
                            {message.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6">
                <Card className="w-full max-w-sm p-6 flex flex-col items-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4 text-primary/20" />
                  <h3 className="font-medium text-lg">No messages found</h3>
                  <p className="text-sm text-muted-foreground text-center mt-2 mb-4">
                    {searchQuery
                      ? "Try a different search term"
                      : "Start a conversation to see messages here"}
                  </p>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> New Message
                  </Button>
                </Card>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Requests Tab Content */}
        <TabsContent value="requests" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-[calc(100vh-13.5rem)]">
            {filteredRequests.length > 0 ? (
              <div className="divide-y">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="px-4 py-3 hover:bg-accent/20 transition-colors flex items-start gap-3"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={request.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {request.name.charAt(0) +
                            request.name.split(" ")[1]?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{request.name}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatTimestamp(request.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {request.requestMessage}
                      </p>
                      {request.mutual > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {request.mutual} mutual connection
                          {request.mutual > 1 ? "s" : ""}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="h-8 rounded-full px-4"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full px-4"
                          onClick={() => handleDeclineRequest(request.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6">
                <Card className="w-full max-w-sm p-6 flex flex-col items-center">
                  <BellRing className="h-12 w-12 text-muted-foreground mb-4 text-primary/20" />
                  <h3 className="font-medium text-lg">No pending requests</h3>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Connection requests will appear here
                  </p>
                </Card>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
