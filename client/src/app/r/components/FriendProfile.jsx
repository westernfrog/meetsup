"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, VenusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const placeholderUser = {
  avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=ShadowQuartz",
  name: "Shadow Quartz",
  age: 24,
  gender: "male",
  interests: ["Photography", "Hiking", "Coffee", "Art", "Music"],
  bio: "Adventure seeker and coffee enthusiast. Love exploring new places and meeting interesting people. Always up for a good conversation!",
  gallery: [],
  online: true,
};

export default function FriendProfile({ isOpen, onClose, data }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(placeholderUser);
  const [newInterest, setNewInterest] = useState("");

  // Handle cases where data might be null/undefined
  console.log("Profile data:", data);

  // Use data if available, otherwise fall back to placeholder
  const userProfile = data || placeholderUser;

  // Create safe values with fallbacks
  const userName = userProfile.name || "Unknown User";
  const userAge = userProfile.age || "Unknown";
  const userGender = userProfile.gender || "Unknown";
  const userId = userProfile.id || userProfile.fId || "default";
  const userBio =
    userProfile.description || userProfile.bio || "No bio available";
  const userInterests = userProfile.interests || [];
  const userGallery = userProfile.profilePics || userProfile.gallery || [];
  const isOnline =
    userProfile.online !== undefined ? userProfile.online : false;

  // Generate avatar URL using the user's ID
  const avatarUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${userId}`;

  console.log("Gallery", userGallery);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[100vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between mb-3">
              <span className="text-lg text-center">Profile</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative overflow-hidden rounded-md">
                <Image
                  src={avatarUrl}
                  alt={userName}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-3 font-medium truncate text-xl capitalize">
                    {userName}
                    <VenusIcon size={18} className="stroke-pink-500" />
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <span className="truncate capitalize">
                    {userGender.toLowerCase()}
                  </span>
                  <span className="truncate capitalize">
                    {userAge} years old
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-lg">Bio</h4>
              <p className="text-gray-400 leading-relaxed">{userBio}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-lg">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {userInterests.length > 0 ? (
                  userInterests.map((interest, index) => (
                    <Badge key={index} className="px-2 text-sm">
                      {interest}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-400">No interests listed</span>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">Gallery</h4>
                <span className="text-sm text-gray-500">
                  {userGallery.length}/4 photos
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {userGallery.length > 0 ? (
                  userGallery.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(image)}
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
                  ))
                ) : (
                  <div className="col-span-2 sm:col-span-4 text-center py-8">
                    <span className="text-gray-400">No photos available</span>
                  </div>
                )}
              </div>
            </div>
          </div>
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
              src={selectedImage.url}
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
