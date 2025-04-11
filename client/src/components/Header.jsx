"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";

export default function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    data: userData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch user data");
        }

        return res.json();
      } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
  });

  const profilePic = userData?.user?.profilePics?.[0]?.url;
  const userName = userData?.user?.name || "Guest";
  const userInitial = userName ? userName[0].toUpperCase() : "G";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      // Could add toast notification here
    }
  };

  // Content for user avatar and name
  const userProfileContent = (
    <div className="flex items-center gap-3">
      {isLoading ? (
        <>
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </>
      ) : isError ? (
        <>
          <Avatar className="h-10 w-10 border shadow-sm">
            <AvatarFallback className="bg-rose-100 text-rose-500">
              !
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-muted-foreground">
              Error loading profile
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-blue-500 hover:underline"
            >
              Reload
            </button>
          </div>
        </>
      ) : (
        <>
          <Avatar className="h-10 w-10 border shadow-sm">
            {profilePic ? (
              <AvatarImage
                src={profilePic}
                alt={userName}
                className="object-cover"
              />
            ) : (
              <AvatarImage
                src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${
                  userData?.user?.id || "anonymous"
                }`}
                alt={userName}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-primary/10 text-primary">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{userName}</p>
            {userData?.user?.email && (
              <p className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                {userData.user.email}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <Card className="mb-6 border-0 rounded-none shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-background/95 dark">
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-lg sm:text-xl">Meetsup</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/discover"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Discover
            </Link>
            <Link
              href="/chats"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Chats
            </Link>
            <Link
              href="/help"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Help
            </Link>

            <div className="w-px h-6 bg-border mx-1"></div>

            {/* User Menu (Desktop) */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-1">
                    <div className="flex items-center gap-2">
                      {userProfileContent}
                      <ChevronDown
                        size={16}
                        className="text-muted-foreground"
                      />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User size={16} className="mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings size={16} className="mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications" className="cursor-pointer">
                      <Bell size={16} className="mr-2" />
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-rose-500 focus:text-rose-500"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center py-4">
                    <span className="font-bold text-lg">Menu</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <X size={20} />
                    </Button>
                  </div>

                  {/* User Profile Section */}
                  {user && (
                    <div className="border rounded-lg p-4 mb-6">
                      {userProfileContent}
                    </div>
                  )}

                  {/* Mobile Navigation Links */}
                  <div className="space-y-4">
                    <Link
                      href="/discover"
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Discover
                    </Link>
                    <Link
                      href="/chats"
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Chats
                    </Link>
                    <Link
                      href="/help"
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <HelpCircle size={16} />
                      Help Center
                    </Link>
                  </div>

                  <div className="mt-auto">
                    {user ? (
                      <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="w-full"
                      >
                        <LogOut size={16} className="mr-2" />
                        Logout
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full" asChild>
                          <Link
                            href="/login"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Login
                          </Link>
                        </Button>
                        <Button className="w-full" asChild>
                          <Link
                            href="/signup"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Sign Up
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
