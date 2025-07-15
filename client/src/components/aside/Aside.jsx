"use client";

import {
  CheckCheckIcon,
  CheckIcon,
  CirclePlusIcon,
  CircleQuestionMarkIcon,
  EarthIcon,
  MarsIcon,
  SearchIcon,
  VenusIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/socket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const navigation = [
  { name: "New Chat", href: "/", icon: CirclePlusIcon },
  { name: "Search Chats", href: "/search", icon: SearchIcon },
  { name: "Global", href: "/global", icon: EarthIcon },
];

const tabs = [
  { name: "All", action: "" },
  { name: "Unread", action: "" },
  { name: "Favourites", action: "" },
];

const placeholderChats = [
  {
    avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=CrimsonMeteor",
    name: "Crimson Meteor",
    lastMessage: "Hey! Just joined, what's up?",
    timestamp: "10:24 AM",
    read: true,
    online: true,
    gender: "male",
  },
  {
    avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=VelvetNova",
    name: "Velvet Nova",
    lastMessage: "That room was wild 🔥",
    timestamp: "Yesterday",
    read: false,
    online: false,
    gender: "female",
  },
  {
    avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=ShadowQuartz",
    name: "Shadow Quartz",
    lastMessage: "Let's catch up later tonight.",
    timestamp: "9:03 PM",
    read: true,
    online: true,
    gender: "male",
  },
  {
    avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=EchoFalcon",
    name: "Echo Falcon",
    lastMessage: "Can't believe that happened 😂",
    timestamp: "2:17 PM",
    read: false,
    online: false,
    gender: "male",
  },
  {
    avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=BlazingZephyr",
    name: "Blazing Zephyr",
    lastMessage: "Typing indicator works great now.",
    timestamp: "Mon",
    read: true,
    online: true,
    gender: "female",
  },
  {
    avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=FrostRaven",
    name: "Frost Raven",
    lastMessage: "Back in 5 mins ⏳",
    timestamp: "11:47 AM",
    read: false,
    online: true,
    gender: "female",
  },
  {
    avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=ObsidianWraith",
    name: "Obsidian Wraith",
    lastMessage: "Wanna join the global chat?",
    timestamp: "Yesterday",
    read: true,
    online: false,
    gender: "male",
  },
  {
    avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=LunarFox",
    name: "Lunar Fox",
    lastMessage: "New room is live 🎉",
    timestamp: "7:15 PM",
    read: false,
    online: true,
    gender: "female",
  },
  {
    avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=NeonFlare",
    name: "Neon Flare",
    lastMessage: "Okay cool, see ya there!",
    timestamp: "6:32 PM",
    read: true,
    online: false,
    gender: "male",
  },
  {
    avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=QuantumTiger",
    name: "Quantum Tiger",
    lastMessage: "Lol that was chaotic 😂",
    timestamp: "Today",
    read: false,
    online: true,
    gender: "female",
  },
];

export default function Aside(params) {
  const router = useRouter();
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
      return data.conversations
        .filter((c) => c.user1 && c.user2)
        .sort(
          (a, b) =>
            new Date(b.messages?.[0]?.createdAt ?? 0).getTime() -
            new Date(a.messages?.[0]?.createdAt ?? 0).getTime()
        );
    },
    enabled: !!user,
    refetchInterval: 2000,
    staleTime: 5000,
  });

  console.log(conversations);

  return (
    <>
      <aside className="flex flex-col gap-2 h-full">
        <div className="flex items-center justify-between p-3">
          <Link href="/">
            <Image
              src="https://cdn-icons-png.flaticon.com/512/17734/17734786.png"
              width={200}
              height={200}
              alt="Occasion Logo"
              className="w-10 h-10 object-cover object-center"
            />
          </Link>
          <Button
            variant="secondary"
            className="cursor-pointer flex items-center gap-3"
          >
            <CircleQuestionMarkIcon strokeWidth={1.5} />
            <span>Help</span>
          </Button>
        </div>
        <nav className="flex flex-col">
          {navigation.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex items-center gap-2 hover:bg-secondary transition-all duration-200 hover:shadow p-3 rounded-md"
            >
              <item.icon strokeWidth={1.5} size={18} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-4 p-3">
          <span className="text-lg">Messages</span>
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((item, index) => (
              <Button variant="outline" key={index} className="cursor-pointer">
                {item.name}
              </Button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-4 items-center justify-center h-full p-3">
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col gap-4 items-center justify-center h-full p-3">
            <span className="w-64 text-center text-red-500">
              {error.message}
            </span>
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0 pr-2">
            {conversations.map((chat, index) => {
              const otherUser = chat.user1.id === user.id ? chat.user2 : chat.user1;
              return (
                <button
                  onClick={() => router.push(`/r/${chat.id}`)}
                  key={index}
                  className="cursor-pointer flex items-center justify-between gap-3 hover:bg-secondary p-3 rounded-md transition-all duration-200"
                >
                  <div className="relative overflow-hidden rounded-full w-12 h-12 border shadow bg-secondary">
                    <Image
                      src={
                        otherUser.profilePics?.[0]?.url ||
                        `https://api.dicebear.com/9.x/adventurer/png?seed=${otherUser.id}`
                      }
                      alt={otherUser.name}
                      width={450}
                      height={450}
                      className="rounded-full w-full h-full object-center object-cover"
                    />
                    {onlineUsers.has(otherUser.id) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate flex items-center gap-2">
                        {otherUser.name}
                        {otherUser.gender == "male" ? (
                          <MarsIcon size={16} className="stroke-blue-500" />
                        ) : (
                          <VenusIcon size={16} className="stroke-pink-500" />
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(
                          chat.messages?.[0]?.createdAt
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500">
                      <span className="truncate max-w-[260px]">
                        {chat.messages?.[0]?.content}
                      </span>
                      {chat.messages?.[0]?.seen ? (
                        <span className="text-emerald-500 font-medium">
                          <CheckCheckIcon size={18} />
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          <CheckIcon size={18} />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center justify-center h-full p-3">
            <Image
              src="https://cdn-icons-png.flaticon.com/512/948/948593.png"
              width={200}
              height={200}
              alt="MailBox"
              className="w-44 h-44 object-center object-cover grayscale brightness-50"
            />
            <span className="w-64 text-center text-gray-600">
              Looks like you are the popular one here. No messages yet!
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
