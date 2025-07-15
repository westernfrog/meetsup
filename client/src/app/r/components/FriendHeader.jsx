"use client";

import Image from "next/image";
import { MarsIcon, Trash2Icon, VenusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import FriendProfile from "./FriendProfile";

export default function FriendHeader({ data, typingUsers }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!data) {
    return null;
  }

  const userName = data.name || "Unknown User";
  const userAge = data.age || "Unknown";
  const userGender = data.gender || "Unknown";
  const userId = data.id || data.fId || "default";

  const isOtherUserTyping = typingUsers.includes(data.id);

  return (
    <>
      <header className="flex items-center justify-between gap-2 px-5 py-2 border-b">
        <button
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center justify-between gap-3 cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-full w-12 h-12 border">
            <Image
              src={data.profilePics?.[0]?.url || `https://api.dicebear.com/9.x/adventurer/svg?seed=${userId}`}
              alt={userName}
              width={50}
              height={50}
              className="rounded-full w-full h-full object-center object-cover"
            />
            {/* {user.online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
            )} */}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className="font-medium truncate capitalize"
                title={userName}
              >
                {userName}
              </span>
              {userGender === "MALE" ? (
                <MarsIcon size={18} className="stroke-blue-500" />
              ) : userGender === "FEMALE" ? (
                <VenusIcon size={18} className="stroke-pink-500" />
              ) : null}
            </div>
            <div className="flex items-center justify-between text-gray-500">
              {isOtherUserTyping ? (
                <span className="text-sm text-emerald-500">Typing...</span>
              ) : (
                <span
                  className="truncate capitalize"
                  title={`${userGender}, ${userAge}`}
                >
                  {userGender.toLowerCase()}, {userAge}
                </span>
              )}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              className="cursor-pointer flex items-center gap-3"
            >
              <Trash2Icon />
              Delete Chat
            </Button>
          </div>
        </div>
      </header>
      <FriendProfile
        data={data}
        isOpen={isProfileOpen}
        onClose={(open) => setIsProfileOpen(open)}
      />
    </>
  );
}
