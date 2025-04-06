"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Loader2, Upload, User, X, Save, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, loginAnonymously, logout, loading } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "OTHER",
    description: "",
    interests: "",
    profilePics: [],
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { data, isLoading: isUserLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (data?.user) {
      const u = data.user;
      setFormData({
        name: u.name ?? "",
        age: u.age?.toString() ?? "",
        gender: u.gender ?? "OTHER",
        description: u.description ?? "",
        interests: Array.isArray(u.interests) ? u.interests.join(", ") : "",
        profilePics: Array.isArray(u.profilePics) ? u.profilePics : [],
      });
    }
  }, [data]);

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

      toast("Image Uploaded", {
        description: "Image uploaded successfully",
      });

      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
    } catch (error) {
      toast("Error occured", {
        description: { error: error.message },
      });
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
            profilePics: newData.profilePics,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast("Success");
    },
    onError: (error) => {
      toast("Error occured", {
        description: { error: error.message },
      });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => saveMutation.mutate(formData);

  const [loggingIn, setLoggingIn] = useState(false);
  const handleLogin = async () => {
    setLoggingIn(true);
    try {
      await loginAnonymously();
    } catch (err) {
      console.log(err);
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading || isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 dark">
      <Card className="shadow-lg border-t-4 border-t-blue-500">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">
                {data ? `Welcome, ${data.user.name || "User"}` : "Profile"}
              </CardTitle>
              {data && (
                <p className="text-sm text-muted-foreground mt-1">
                  ID: {data.user.id}
                </p>
              )}
            </div>
            {data && (
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

        <CardContent className="space-y-6 pt-6">
          {data ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name</label>
                  <Input
                    name="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Age</label>
                  <Input
                    name="age"
                    type="number"
                    placeholder="Your age"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Gender</label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, gender: val }))
                  }
                >
                  <SelectTrigger className="w-full">
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
                <label className="text-sm font-medium mb-1 block">Bio</label>
                <Textarea
                  name="description"
                  placeholder="Tell us about yourself..."
                  value={formData.description}
                  onChange={handleChange}
                  className="min-h-24"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Interests
                </label>
                <Input
                  name="interests"
                  placeholder="Photography, Travel, Music, etc."
                  value={formData.interests}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate interests with commas
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium block">
                  Profile Pictures
                </label>

                <div
                  className={`border border-dashed rounded-lg p-6 text-center transition-all ${
                    isUploading ? "bg-blue-50 border-blue-300" : ""
                  }`}
                >
                  {isUploading ? (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <Loader2
                          className="animate-spin text-blue-500"
                          size={24}
                        />
                      </div>
                      <p className="text-sm font-medium text-blue-600">
                        Uploading image...
                      </p>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  ) : previewUrl ? (
                    <div className="space-y-3">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-32 w-auto mx-auto object-cover rounded"
                      />
                      <p className="text-sm">Processing image...</p>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Upload size={20} className="text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">
                        Click to upload a profile picture
                      </span>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or GIF up to 2MB
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
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                    {formData.profilePics.map((pic) => (
                      <div
                        key={pic.imageId}
                        className="relative aspect-square border rounded-md overflow-hidden group"
                      >
                        <img
                          src={pic.url}
                          alt="Profile"
                          className="object-cover w-full h-full"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => removePic(pic.imageId)}
                          className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleSave}
                disabled={saveMutation.isLoading}
                className="w-full"
              >
                {saveMutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User size={32} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-medium">Create Your Profile</h3>
              <p className="text-sm text-center text-muted-foreground mb-2">
                Login anonymously to set up your profile
              </p>
              <Button
                onClick={handleLogin}
                disabled={loggingIn}
                size="lg"
                className="px-8"
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login Anonymously"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
