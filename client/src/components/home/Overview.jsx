"use client";

import {
  Search,
  Instagram,
  Twitter,
  Facebook,
  MarsIcon,
  VenusIcon,
  VenusAndMarsIcon,
  Loader2Icon,
} from "lucide-react";

import Image from "next/image";
import { useSocket } from "@/lib/socket";
import { useState, useEffect } from "react";
import { Slider } from "../ui/slider";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Label } from "../ui/label";

export default function Overview() {
  const { socket, isReady } = useSocket();
  const router = useRouter();

  // State declarations
  const [ageRange, setAgeRange] = useState([18, 35]);
  const [selectedGender, setSelectedGender] = useState("ANY");
  const [isSearching, setIsSearching] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const genderOptions = [
    { id: "MALE", label: "Male", icon: MarsIcon },
    { id: "FEMALE", label: "Female", icon: VenusIcon },
    { id: "ANY", label: "Any", icon: VenusAndMarsIcon },
  ];

  useEffect(() => {
    if (!isReady || !socket) return;

    // Handle when user finds a partner (they were actively searching)
    socket.on("partnerFound", ({ roomId, partner }) => {
      setIsSearching(false);
      setIsWaiting(false);
      router.push(`/r/${roomId}`);
    });

    // Handle when user gets matched but wasn't actively searching
    socket.on("matchNotification", ({ roomId, partner }) => {
      // You might want to show a notification here instead of auto-navigating
      // For now, we'll just log it - you can implement a notification system
      console.log("You've been matched with someone!", partner);
      // Optional: Auto-navigate or show a popup asking if they want to join
      // router.push(`/r/${roomId}`);
    });

    socket.on("waitingForPartner", () => {
      setIsWaiting(true);
    });

    socket.on("findPartnerCanceled", () => {
      setIsSearching(false);
      setIsWaiting(false);
    });

    return () => {
      socket.off("partnerFound");
      socket.off("matchNotification");
      socket.off("waitingForPartner");
      socket.off("findPartnerCanceled");
    };
  }, [isReady, socket, router]);

  const handleStartSearch = () => {
    if (!isReady || !socket) {
      console.log("Socket not ready yet.");
      return;
    }

    setIsSearching(true);
    setIsWaiting(false); // Reset waiting state
    socket.emit("findPartner", {
      ageRange,
      gender: selectedGender,
    });
  };

  const handleCancelSearch = () => {
    if (!isReady || !socket) return;
    socket.emit("cancelFindPartner");
    setIsSearching(false);
    setIsWaiting(false);
  };

  return (
    <main className="flex overflow-auto items-center h-full pb-16 justify-center">
      <div className="w-full max-w-3xl space-y-4">
        <div className="border rounded-2xl p-6 shadow-sm">
          <div className="text-center space-y-2 mb-6">
            <Image
              src="https://cdn-icons-png.flaticon.com/512/508/508786.png"
              width={200}
              height={200}
              alt="Occasion Logo"
              className="w-10 h-10 object-cover object-center mx-auto animate-pulse"
            />
            <h1 className="text-2xl font-semibold">Find Your Perfect Match</h1>
            <p className="text-muted-foreground">
              Set your preferences and discover genuine people nearby.
            </p>
          </div>
          <div className="mb-8 p-4 bg-muted rounded-xl">
            <h3 className="font-semibold text-foreground mb-2">
              How it works:
            </h3>
            <ul className="text-gray-500 space-y-1 list-disc pl-4">
              <li>Anonymous and secure 1-on-1 conversations</li>
              <li>Real-time messaging with typing indicators</li>
              <li>No signup required - start chatting instantly</li>
              <li>End conversation anytime and find someone new</li>
            </ul>
          </div>
          <div className="space-y-4 mb-6">
            <Label className="text-base">
              Age Range: {ageRange[0]} - {ageRange[1]} years
            </Label>
            <Slider
              defaultValue={ageRange}
              min={16}
              max={100}
              step={1}
              onValueChange={(value) => setAgeRange(value)}
            />
            <div className="flex justify-between text-sm">
              <span>16 years</span>
              <span>100 years</span>
            </div>
          </div>
          <div className="space-y-2 mb-6">
            <Label className="text-base">Looking For</Label>
            <div className="grid grid-cols-3 gap-2">
              {genderOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.id}
                    variant={
                      selectedGender === option.id ? "default" : "outline"
                    }
                    onClick={() => setSelectedGender(option.id)}
                    className="flex items-center gap-3 cursor-pointer"
                    disabled={isSearching}
                  >
                    <Icon strokeWidth={1.5} />
                    <span>{option.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
          {!isSearching ? (
            <Button
              onClick={handleStartSearch}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 cursor-pointer"
              disabled={!isReady}
            >
              <Search />
              Start Searching
            </Button>
          ) : (
            <Button
              onClick={handleCancelSearch}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 cursor-pointer"
              disabled={!isReady}
            >
              {isWaiting ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search />
              )}
              {isWaiting ? "Waiting for partner..." : "Cancel Search"}
            </Button>
          )}

          <p className="text-center text-sm text-muted-foreground mt-4">
            Join thousands of users finding meaningful connections daily.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <a href="#">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="#">
            <Twitter className="h-5 w-5" />
          </a>
          <a href="#">
            <Facebook className="h-5 w-5" />
          </a>
        </div>
      </div>
    </main>
  );
}
