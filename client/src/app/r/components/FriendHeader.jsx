"use client";

import Image from "next/image";
import { Trash2Icon, VenusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Profile from "./FriendProfile";

export default function FriendHeader({ user }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between gap-2 px-5 py-3 border-b">
        <button
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center justify-between gap-3 cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-md">
            <Image
              src={user.avatar}
              alt={user.name}
              width={50}
              height={50}
              className="rounded-full"
            />
            {user.online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">
                {user.name}
              </span>
              <VenusIcon size={18} className="stroke-pink-500" />
            </div>
            <div className="flex items-center justify-between text-gray-500">
              <span className="truncate capitalize">
                {user.gender}, {user.age}
              </span>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="cursor-pointer flex items-center gap-3"
            >
              <Trash2Icon />
              Delete Chat
            </Button>
          </div>
        </div>
      </header>
      <Profile
        isOpen={isProfileOpen}
        onClose={(open) => setIsProfileOpen(open)}
      />
    </>
  );
}
