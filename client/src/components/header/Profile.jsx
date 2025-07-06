"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Edit,
  Camera,
  VenusIcon,
  Save,
  X,
  MarsIcon,
  Laugh,
  HeartHandshake,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useAuth } from "@/contexts/AuthContext";

export default function Profile({ isOpen, onClose }) {
  const { user, loading, setUser } = useAuth(); // Added setUser from AuthContext
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [newInterest, setNewInterest] = useState("");
  const [isSaving, setIsSaving] = useState(false); // New state for saving
  const [uploadingImage, setUploadingImage] = useState(false); // New state for image upload
  const fileInputRef = useRef(null); // Ref for file input

  useEffect(() => {
    if (user) {
      setEditedProfile({
        ...user,
        bio: user.description || "", // Map description to bio
        avatar: `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.id}`, // Always use DiceBear for avatar
        gallery: user.profilePics || [], // Map profilePics to gallery
      });
    }
  }, [user]);

  if (loading || !editedProfile) {
    return null; // Or a loading spinner
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: editedProfile.name,
            age: editedProfile.age,
            gender: editedProfile.gender,
            description: editedProfile.bio, // Map bio back to description
            interests: editedProfile.interests,
            profilePics: editedProfile.gallery, // Map gallery back to profilePics
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const data = await response.json();
      setUser(data.user); // Update user in AuthContext
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile({
      ...user,
      bio: user.description || "",
      avatar: `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.id}`,
      gallery: user.profilePics || [],
    });
    setIsEditing(false);
  };

  const addInterest = () => {
    if (
      newInterest.trim() &&
      !editedProfile.interests.includes(newInterest.trim())
    ) {
      setEditedProfile((prev) => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()],
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (interestToRemove) => {
    setEditedProfile((prev) => ({
      ...prev,
      interests: prev.interests.filter(
        (interest) => interest !== interestToRemove
      ),
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addInterest();
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
          {
            method: "POST",
            body: formData,
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Image upload failed");
        }

        const data = await response.json();
        setEditedProfile((prev) => ({
          ...prev,
          gallery: [...prev.gallery, { url: data.url, imageId: data.imageId }],
        }));
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const removeProfileImage = (imageIdToRemove) => {
    setEditedProfile((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((pic) => pic.imageId !== imageIdToRemove),
    }));
  };

  const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "ANY", label: "Any" },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[100vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-xl">Profile</span>
              {!isEditing ? (
                <Button
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit size={16} />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="flex items-center gap-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="flex items-center gap-2"
                    disabled={isSaving || uploadingImage}
                  >
                    {isSaving ? "Saving..." : "Save"}
                    {isSaving ? null : <Save size={16} />}
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {!isEditing ? (
            // View Mode
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="relative overflow-hidden rounded-md">
                  <Image
                    src={editedProfile.avatar}
                    alt={editedProfile.name}
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-3 font-medium truncate text-xl capitalize">
                      {editedProfile.name}
                      {editedProfile.gender === "FEMALE" && (
                        <VenusIcon size={18} className="stroke-pink-500" />
                      )}
                      {editedProfile.gender === "MALE" && (
                        <MarsIcon size={18} className="stroke-blue-500" />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <span className="truncate capitalize">
                      {editedProfile.gender.toLowerCase()}
                    </span>
                    <span className="truncate capitalize">
                      {editedProfile.age} years old
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-lg">Bio</h4>
                <p className="text-gray-400 leading-relaxed">
                  {editedProfile.bio || "No bio provided."}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-lg">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {editedProfile.interests &&
                  editedProfile.interests.length > 0 ? (
                    editedProfile.interests.map((interest, index) => (
                      <Badge key={index} className="px-2 text-sm">
                        {interest}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-400">No interests added yet.</p>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-lg">Gallery</h4>
                  <span className="text-sm text-gray-500">
                    {editedProfile.gallery.length}/4 photos
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {editedProfile.gallery.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(image.url)}
                    >
                      <Image
                        src={image.url}
                        alt={`Gallery image ${index + 1}`}
                        width={300}
                        height={300}
                        className="object-cover w-full h-full"
                        priority={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative overflow-hidden rounded-md">
                  <Image
                    src={editedProfile.avatar}
                    alt={editedProfile.name}
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                  <div
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Camera size={20} className="text-white" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block font-medium mb-1">Name</label>
                      <Input
                        value={editedProfile.name}
                        onChange={(e) =>
                          setEditedProfile((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter your name"
                        className="capitalize"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block font-medium mb-1">Age</label>
                      <Input
                        type="number"
                        value={editedProfile.age}
                        onChange={(e) =>
                          setEditedProfile((prev) => ({
                            ...prev,
                            age: parseInt(e.target.value),
                          }))
                        }
                        placeholder="Age"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block font-medium mb-1">Gender</label>
                      <Select
                        value={editedProfile.gender}
                        onValueChange={(value) =>
                          setEditedProfile((prev) => ({
                            ...prev,
                            gender: value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Bio</label>
                <Textarea
                  value={editedProfile.bio}
                  onChange={(e) =>
                    setEditedProfile((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  placeholder="Tell us about yourself..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Interests</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editedProfile.interests.map((interest, index) => (
                    <Badge
                      key={index}
                      className="px-2 text-sm flex items-center gap-1"
                    >
                      {interest}
                      <X
                        size={12}
                        className="cursor-pointer hover:text-red-500"
                        onClick={() => removeInterest(interest)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add an interest"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addInterest}
                    disabled={!newInterest.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Gallery</h4>
                  <span className="text-sm text-gray-500">
                    {editedProfile.gallery.length}/4 photos
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {editedProfile.gallery.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <Image
                        src={image.url}
                        alt={`Gallery image ${index + 1}`}
                        width={300}
                        height={300}
                        className="object-cover w-full h-full"
                        priority={true}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-6 h-6 p-0"
                          onClick={() => removeProfileImage(image.imageId)}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {editedProfile.gallery.length < 4 && (
                    <div
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <div className="text-center">
                        {uploadingImage ? (
                          <span className="loading loading-spinner loading-sm"></span> // Placeholder for loading spinner
                        ) : (
                          <Camera
                            size={24}
                            className="mx-auto text-gray-400 mb-2"
                          />
                        )}
                        <span className="text-sm text-gray-500">
                          {uploadingImage ? "Uploading..." : "Add Photo"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-xl max-h-[50vh] p-0 border-0 aspect-square overflow-hidden flex items-center justify-center">
            <DialogHeader>
              <DialogTitle className="hidden" />
            </DialogHeader>
            <Image
              src={selectedImage}
              alt="Gallery image"
              width={500}
              height={500}
              className="rounded-lg w-full h-full object-contain mx-auto"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
