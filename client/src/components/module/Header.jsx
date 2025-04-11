"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "./ThemeToggle";
import {
  CookieIcon,
  HeartHandshakeIcon,
  ReceiptTextIcon,
  Trash2Icon,
  UserIcon,
  Loader2,
  Upload,
  X,
  Save,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Header() {
  const { user, logout, loginAnonymously } = useAuth();
  const queryClient = useQueryClient();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Image upload states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "OTHER",
    description: "",
    interests: "",
    profilePics: [],
  });

  const {
    data: userData,
    isLoading: isUserDataLoading,
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

  // Initial loading state handling
  useEffect(() => {
    if (user !== undefined) {
      // Only set initializing to false when we have a definitive user state
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 300); // Short delay to ensure stable UI state

      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    if (userData?.user) {
      const u = userData.user;
      setFormData({
        name: u.name ?? "",
        age: u.age?.toString() ?? "",
        gender: u.gender ?? "OTHER",
        description: u.description ?? "",
        interests: Array.isArray(u.interests) ? u.interests.join(", ") : "",
        profilePics: Array.isArray(u.profilePics) ? u.profilePics : [],
      });
    }
  }, [userData]);

  const profilePic = userData?.user?.profilePics?.[0]?.url;
  const userName = userData?.user?.name || "Guest";
  const userId = userData?.user?.id || "ID: N/A";
  const userInitial = userName ? userName[0].toUpperCase() : "G";

  const diceBearUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`;

  const handleLogout = async () => {
    try {
      await logout();
      queryClient.clear(); // Clear all query cache
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Logout failed", {
        description: error.message,
      });
    }
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/delete-account`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to delete account");
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear(); // Clear all query cache
      toast.success("Account deleted successfully");
      setIsDeleteDialogOpen(false);
      // Force logout after account deletion
      logout();
    },
    onError: (error) => {
      toast.error("Failed to delete account", {
        description: error.message,
      });
    },
  });

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: async (newData) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: newData.name,
            age: Number(newData.age) || null,
            gender: newData.gender,
            description: newData.description,
            interests: newData.interests
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            profilePics: newData.profilePics || [],
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Profile saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save profile", {
        description: error.message,
      });
    },
  });

  const handleSaveProfile = () => {
    saveMutation.mutate(formData);
  };

  // Handle anonymous login
  const handleAnonymousLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginAnonymously();
      toast.success("Logged in anonymously");
    } catch (err) {
      toast.error("Login failed", {
        description: err.message || "An error occurred during login",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle file upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const increment = Math.floor(Math.random() * 15) + 5;
          const newProgress = Math.min(prev + increment, 90);
          return newProgress;
        });
      }, 500);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Upload failed");
      }

      setFormData((prev) => ({
        ...prev,
        profilePics: [
          ...prev.profilePics,
          { url: json.url, imageId: json.fileId },
        ],
      }));

      toast.success("Image uploaded successfully");
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
    } catch (error) {
      toast.error("Upload failed", {
        description: error.message,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Remove profile picture
  const removePic = (imageId) => {
    setFormData((prev) => ({
      ...prev,
      profilePics: prev.profilePics.filter((p) => p.imageId !== imageId),
    }));
  };

  // Render auth section more carefully with proper loading states
  const renderAuthSection = () => {
    // Show skeleton during initialization
    if (isInitializing) {
      return (
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-24" /> {/* Button skeleton */}
        </div>
      );
    }

    // User is logged in, show avatar or loading avatar
    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-primary/10 hover:bg-primary/20 px-3 py-1.5 transition-colors duration-300 ease-in-out outline-0 cursor-pointer">
            {isUserDataLoading ? (
              <Skeleton className="h-8 w-8 rounded-full" />
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarImage className="" src={profilePic || diceBearUrl} />
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
            )}
            <span className="font-medium text-sm hidden sm:block">
              {userName}
            </span>
            <ChevronDown size={16} className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72" align="end">
            <div className="px-3 py-2 flex items-center gap-3 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profilePic || diceBearUrl} />
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{userName}</div>
                <div className="text-xs text-muted-foreground">{userId}</div>
              </div>
            </div>
            <Dialog
              open={isProfileDialogOpen}
              onOpenChange={setIsProfileDialogOpen}
            >
              <DialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="flex items-center gap-2 mt-1"
                >
                  <UserIcon className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="overflow-y-scroll max-h-[90vh] xl:min-w-xl">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center mb-4">
                  <Avatar className="h-20 w-20 mb-2">
                    <AvatarImage src={profilePic || diceBearUrl} />
                    <AvatarFallback className="text-xl">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium text-lg">{userName}</h3>
                  <p className="text-xs text-muted-foreground">ID: {userId}</p>
                </div>

                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        Name
                      </label>
                      <Input
                        name="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={handleChange}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        Age
                      </label>
                      <Input
                        name="age"
                        type="number"
                        placeholder="Your age"
                        value={formData.age}
                        onChange={handleChange}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      Gender
                    </label>
                    <Select
                      value={formData.gender}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, gender: val }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      Bio
                    </label>
                    <Textarea
                      name="description"
                      placeholder="Tell us about yourself..."
                      value={formData.description}
                      onChange={handleChange}
                      className="min-h-16 text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      Interests
                    </label>
                    <Input
                      name="interests"
                      placeholder="Photography, Travel, Music, etc."
                      value={formData.interests}
                      onChange={handleChange}
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Separate with commas
                    </p>
                  </div>
                  <div className="space-y-2 mt-1">
                    <label className="text-xs font-medium block">
                      Profile Pictures
                    </label>

                    <div
                      className={`border border-dashed rounded-lg p-4 text-center transition-all ${
                        isUploading
                          ? "bg-blue-50 dark:bg-blue-950 border-blue-300"
                          : ""
                      }`}
                    >
                      {isUploading ? (
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <Loader2
                              className="animate-spin text-blue-500"
                              size={20}
                            />
                          </div>
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Uploading image...
                          </p>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      ) : previewUrl ? (
                        <div className="space-y-2">
                          <Avatar className="h-16 w-16 mx-auto">
                            <AvatarImage src={previewUrl} alt="Preview" />
                            <AvatarFallback>Preview</AvatarFallback>
                          </Avatar>
                          <p className="text-xs">Processing image...</p>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-1 py-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <Upload
                              size={16}
                              className="text-blue-600 dark:text-blue-400"
                            />
                          </div>
                          <span className="text-xs font-medium">
                            Upload a profile picture
                          </span>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG or GIF up to 10MB
                          </p>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                      )}
                    </div>

                    {formData.profilePics.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {formData.profilePics.map((pic) => (
                          <div
                            key={pic.imageId}
                            className="relative aspect-square rounded-md overflow-hidden group"
                          >
                            <Avatar className="h-full w-full rounded-none">
                              <AvatarImage src={pic.url} alt="Profile" />
                              <AvatarFallback>P</AvatarFallback>
                            </Avatar>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => removePic(pic.imageId)}
                              className="absolute top-1 right-1 w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsProfileDialogOpen(false)}
                    className="h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saveMutation.isLoading}
                    className="h-8"
                  >
                    {saveMutation.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      </>
                    ) : (
                      <>Save</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Link href="/help" passHref>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <HeartHandshakeIcon className="h-4 w-4" />
                Help & Feedback
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <Link href="/privacy" passHref>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <CookieIcon className="h-4 w-4" />
                Privacy Policy
              </DropdownMenuItem>
            </Link>
            <Link href="/terms" passHref>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <ReceiptTextIcon className="h-4 w-4" />
                Terms & Conditions
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(e) => e.preventDefault()}
                  className="flex items-center gap-2 text-red-500 dark:text-red-400"
                >
                  <Trash2Icon className="h-4 w-4" />
                  Delete Account
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </p>
                <DialogFooter className="gap-2 sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountMutation.isLoading}
                  >
                    {deleteAccountMutation.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>Yes, Delete My Account</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // User is not logged in, show login button
    return (
      <Button
        variant="default"
        size="sm"
        onClick={handleAnonymousLogin}
        disabled={isLoggingIn}
        className="rounded-full px-4"
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Logging in...
          </>
        ) : (
          "Continue Anonymously"
        )}
      </Button>
    );
  };

  return (
    <>
      <header className="flex items-center justify-between gap-x-6 w-full">
        <Link href="/" className="flex items-center gap-x-2 select-none">
          <div className="flex items-center gap-2">
            <span className="text-lg">Meetsup</span>
            <Badge variant="outline" className="font-medium">
              v0.1.0
            </Badge>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {renderAuthSection()}
        </div>
      </header>
    </>
  );
}
