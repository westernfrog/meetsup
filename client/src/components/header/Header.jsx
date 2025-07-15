"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import {
  BananaIcon,
  ChevronDownIcon,
  MessageCircleHeartIcon,
  Settings2Icon,
} from "lucide-react";
import { useState } from "react";
import Profile from "./Profile";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "../ui/skeleton"; // Assuming you have a Skeleton component

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <>
      <header className="flex items-center justify-between gap-2 px-5 py-2 border-b">
        <Link href="/" className="text-xl font-medium">
          Meetsup
          <span className="sr-only">Meetsup</span>
        </Link>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="cursor-pointer flex items-center gap-3"
            >
              <BananaIcon />
              Ads
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer flex items-center gap-3"
            >
              <MessageCircleHeartIcon />
              Feedback
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer flex items-center gap-3"
            >
              <Settings2Icon />
              Settings
            </Button>
          </div>
          {!user ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-13 w-13 rounded-full" />
              <Skeleton className="h-4 w-30" />
            </div>
          ) : (
            user && (
              <button
                className="flex items-center justify-between gap-3 cursor-pointer"
                onClick={() => setIsProfileOpen(true)}
              >
                <div className="relative overflow-hidden rounded-full w-12 h-12 border">
                  <Image
                    src={
                      user.profilePics?.[0]?.url ||
                      `https://api.dicebear.com/9.x/adventurer/png?seed=${user.id}`
                    }
                    alt={user.name}
                    width={50}
                    height={50}
                    className="rounded-full w-full h-full object-center object-cover"
                  />
                  {/* Assuming online status is not directly available from user object, or handled elsewhere */}
                  {/* {user.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                  )} */}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate capitalize">
                      {user.name}
                    </span>
                  </div>
                </div>
                <ChevronDownIcon size={18} />
              </button>
            )
          )}
        </div>
      </header>
      <Profile
        isOpen={isProfileOpen}
        onClose={(open) => setIsProfileOpen(open)}
      />
    </>
  );
}
