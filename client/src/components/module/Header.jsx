"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
import { toast } from "sonner";

export default function Header() {
  const { user, logout, loginAnonymously, loading } = useAuth();
  const queryClient = useQueryClient();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const formDataInitialized = useRef(false);

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
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [user]);

  // Only initialize form data once when user data is loaded
  useEffect(() => {
    if (userData?.user && !formDataInitialized.current) {
      const u = userData.user;
      setFormData({
        name: u.name ?? "",
        age: u.age?.toString() ?? "",
        gender: u.gender ?? "OTHER",
        description: u.description ?? "",
        interests: Array.isArray(u.interests) ? u.interests.join(", ") : "",
        profilePics: Array.isArray(u.profilePics) ? u.profilePics : [],
      });
      formDataInitialized.current = true;
    }
  }, [userData]);

  // Reset initialization flag when profile dialog is opened
  useEffect(() => {
    if (userData?.user && isProfileDialogOpen) {
      const u = userData.user;
      setFormData({
        name: u.name || "",
        age: u.age?.toString() || "",
        gender: u.gender || "OTHER",
        description: u.description || "",
        interests: Array.isArray(u.interests) ? u.interests.join(", ") : "",
        profilePics: Array.isArray(u.profilePics) ? u.profilePics : [],
      });
    }
  }, [userData, isProfileDialogOpen]);

  const profilePic = userData?.user?.profilePics?.[0]?.url;
  const userName = userData?.user?.name;
  const userId = userData?.user?.id || "ID: N/A";
  const userInitial = userName ? userName[0].toUpperCase() : "G";

  const diceBearUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`;

  const handleLogout = async () => {
    try {
      await logout();
      queryClient.clear();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Logout failed");
    }
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
      formDataInitialized.current = false;
    },
    onError: (error) => {
      toast.error("Failed to save profile");
    },
  });

  const handleSaveProfile = () => {
    saveMutation.mutate(formData);
    setIsProfileDialogOpen(false);
  };

  const handleAnonymousLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginAnonymously();
      toast.success("Logged in anonymously");
    } catch (err) {
      toast.error("Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

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
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removePic = (imageId) => {
    setFormData((prev) => ({
      ...prev,
      profilePics: prev.profilePics.filter((p) => p.imageId !== imageId),
    }));
  };

  const renderAuthSection = () => {
    if (isInitializing) {
      return (
        <div className="flex items-center gap-4">
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </div>
      );
    }

    if (user) {
      return (
        <div className="relative group">
          <button className="flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 transition-colors">
            {isUserDataLoading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">{userInitial}</span>
                )}
              </div>
            )}
            <span className="font-medium text-sm hidden sm:block">
              {userName || "User"}
            </span>
            <ChevronDown
              size={16}
              className="text-gray-500 dark:text-gray-400"
            />
          </button>

          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
              <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">{userInitial}</span>
                )}
              </div>
              <div>
                <div className="font-medium">{userName || "User"}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {userId}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsProfileDialogOpen(true)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <UserIcon className="h-4 w-4" />
              Profile
            </button>

            <Link
              href="/help"
              className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <HeartHandshakeIcon className="h-4 w-4" />
              Help & Feedback
            </Link>

            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            <Link
              href="/privacy"
              className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <CookieIcon className="h-4 w-4" />
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <ReceiptTextIcon className="h-4 w-4" />
              Terms & Conditions
            </Link>

            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2Icon className="h-4 w-4" />
              Delete Account
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={handleAnonymousLogin}
        disabled={isLoggingIn}
        className="rounded-full px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {isLoggingIn ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Logging in...
          </span>
        ) : (
          "Continue Anonymously"
        )}
      </button>
    );
  };

  return (
    <header className="flex items-center justify-between w-full p-4">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-lg font-semibold">Meetsup</span>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700">
          v0.1.0
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          {/* Replace with your theme toggle icon */}
          <span>🌓</span>
        </button>
        {renderAuthSection()}
      </div>

      {/* Profile Dialog */}
      {isProfileDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Profile</h2>
              <button
                onClick={() => setIsProfileDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col items-center mb-4">
              <div className="h-20 w-20 rounded-full bg-gray-300 dark:bg-gray-600 mb-2 flex items-center justify-center overflow-hidden">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-medium">{userInitial}</span>
                )}
              </div>
              <h3 className="font-medium text-lg">{userName || "User"}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ID: {userId}
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Name</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Age</label>
                  <input
                    name="age"
                    type="number"
                    placeholder="Your age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Bio</label>
                <textarea
                  name="description"
                  placeholder="Tell us about yourself..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Interests
                </label>
                <input
                  name="interests"
                  placeholder="Photography, Travel, Music, etc."
                  value={formData.interests}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Separate with commas
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Profile Pictures
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    isUploading
                      ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600"
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
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : previewUrl ? (
                    <div className="space-y-2">
                      <div className="h-16 w-16 rounded-full mx-auto overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        JPG, PNG or GIF up to 10MB
                      </p>
                      <input
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
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {formData.profilePics.map((pic) => (
                      <div
                        key={pic.imageId}
                        className="relative aspect-square rounded-md overflow-hidden group"
                      >
                        <div className="h-full w-full bg-gray-200 dark:bg-gray-700">
                          <img
                            src={pic.url}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removePic(pic.imageId)}
                          className="absolute top-1 right-1 w-5 h-5 p-0 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsProfileDialogOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saveMutation.isLoading}
                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50 flex items-center gap-2"
              >
                {saveMutation.isLoading && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Are you absolutely sure?
              </h2>
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
