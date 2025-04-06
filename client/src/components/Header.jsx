"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const { user, logout } = useAuth();

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!user,
  });

  const profilePic = userData?.user?.profilePics?.[0]?.url;
  const userName = userData?.user?.name;
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <Card className="mb-6 dark py-4 border-0 rounded-none">
      <CardHeader className="">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              {profilePic ? (
                <AvatarImage
                  src={profilePic}
                  alt={userName || "User"}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-blue-500 text-white">
                {userInitial}
              </AvatarFallback>
            </Avatar>

            <div>
              <CardTitle className="text-lg font-bold">
                {userName || "Profile"}
              </CardTitle>
              {userData && (
                <p className="text-sm text-muted-foreground mt-1">
                  ID: {userData.user.id}
                </p>
              )}
            </div>
          </div>

          {userData && (
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center gap-1"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
