"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  CirclePlusIcon,
  XIcon,
  CameraIcon,
  Edit2Icon,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import LenisScroll from "@/components/LenisScroll";
import { useAuth } from "@/contexts/AuthProvider";

export default function Profile() {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditLookingForOpen, setIsEditLookingForOpen] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const fileInputRef = useRef();
  const { user } = useAuth();

  const [lookingFor, setLookingFor] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lookingFor");
      return saved
        ? JSON.parse(saved)
        : {
            genderPreference: "Male",
            ageMin: 18,
            ageMax: 99,
          };
    }
    return {
      genderPreference: "Male",
      ageMin: 18,
      ageMax: 99,
    };
  });

  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    description: "",
    photos: [],
    interests: [],
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        age: user.age?.toString() || "",
        gender: user.gender
          ? user.gender.charAt(0) + user.gender.slice(1).toLowerCase()
          : "",
        description:
          user.description ||
          "No description available. Add a description to tell others about yourself.",
        photos: user.profilePics || [],
        interests: user.interests || [],
      });
    }
  }, [user]);

  const getAvatarFallback = () => {
    if (!user?.name) return "👤";
    return user.name.charAt(0).toUpperCase();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("photos", file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/upload-photos`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProfile((prev) => ({
        ...prev,
        photos: [...prev.photos, data.url],
      }));
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleSetMainPhoto = async (index) => {
    if (index === 0) return;

    try {
      const newPhotos = [...profile.photos];
      const [removed] = newPhotos.splice(index, 1);
      newPhotos.unshift(removed);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profilePics: newPhotos }),
        }
      );

      if (!res.ok) throw new Error("Update failed");
      setProfile({ ...profile, photos: newPhotos });
      updateUser({ ...user, profilePics: newPhotos });
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: profile.name,
            age: parseInt(profile.age),
            gender: profile.gender.toUpperCase(),
            description: profile.description,
            interests: profile.interests,
          }),
        }
      );

      if (!res.ok) throw new Error("Save failed");
      setIsEditProfileOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleSaveLookingFor = () => {
    localStorage.setItem("lookingFor", JSON.stringify(lookingFor));
    setIsEditLookingForOpen(false);
  };

  return (
    <>
      <LenisScroll>
        <section className="flex flex-col gap-4 min-h-full divide-y divide-white/10 mb-10">
          <div className="flex items-center p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
              <div className="flex-shrink-0 relative group">
                {profile?.photos?.length > 0 ? (
                  <Image
                    src={profile.photos[0]}
                    alt="Profile"
                    width={100}
                    height={100}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover object-center rounded-2xl ring-2 ring-violet-500"
                  />
                ) : (
                  <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white text-2xl font-medium">
                    {getAvatarFallback()}
                  </div>
                )}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900"></div>
                <button
                  className="absolute -bottom-2 -right-2 rounded-full p-1.5 bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer shadow-md"
                  onClick={() => setIsAddPhotoOpen(true)}
                >
                  <Edit2Icon size={16} className="text-violet-400" />
                </button>
              </div>
              <div className="flex-grow w-full">
                <div className="flex justify-between items-center">
                  <h1 className="font-medium text-base">{profile.name}</h1>
                  <button
                    className="text-sm text-violet-400 hover:text-violet-300 cursor-pointer flex items-center gap-1 px-3 py-1 rounded-lg transition-colors"
                    onClick={() => setIsEditProfileOpen(true)}
                  >
                    Edit Profile
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-gray-400 my-1">
                  <span>{profile.age}</span>
                  <span>•</span>
                  <span>{profile.gender}</span>
                </div>
                <p className="line-clamp-2 text-gray-300">
                  {profile.description}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col px-6 pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-medium">About Me</h2>
              <button
                className="text-sm text-violet-400 hover:text-violet-300 cursor-pointer"
                onClick={() => setIsEditProfileOpen(true)}
              >
                Edit
              </button>
            </div>
            <p className="text-gray-300 mb-4">{profile.description}</p>
            <div className="flex items-start">
              <span className="w-24 flex-shrink-0 text-gray-400">
                Interests:
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.interests.length > 0 ? (
                  profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-violet-900/50 text-violet-300 rounded-full text-sm hover:bg-violet-800/50 transition-colors"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">No interests added</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col px-6 pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-medium">Looking For</h2>
              <button
                className="text-sm text-violet-400 hover:text-violet-300 cursor-pointer"
                onClick={() => setIsEditLookingForOpen(true)}
              >
                Edit
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="w-44 text-gray-400">Gender:</span>
                <span className="text-gray-300">
                  {lookingFor.genderPreference}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-44 text-gray-400">Age Range:</span>
                <span className="text-gray-300">
                  {lookingFor.ageMin} - {lookingFor.ageMax}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col px-6 pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-medium">Gallery</h2>
              <button
                className="text-sm text-violet-400 hover:text-violet-300 cursor-pointer"
                onClick={() => setIsAddPhotoOpen(true)}
              >
                Manage Photos
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-auto w-full">
              {profile.photos.slice(0, 5).map((photo, index) => (
                <div
                  key={index}
                  className="relative group aspect-square w-full rounded-xl overflow-hidden border border-white/10 hover:border-violet-500 transition-colors"
                >
                  <Image
                    src={photo}
                    alt={`Gallery photo ${index + 1}`}
                    fill
                    className="object-cover object-center"
                  />
                  {index !== 0 && (
                    <button
                      className="absolute top-2 right-2 rounded-full p-1 bg-violet-900/80 hover:bg-gray-900 transition-all duration-300 cursor-pointer"
                      onClick={() => {
                        const newPhotos = [...profile.photos];
                        newPhotos.splice(index, 1);
                        setProfile({ ...profile, photos: newPhotos });
                      }}
                    >
                      <XIcon size={16} className="text-gray-300" />
                    </button>
                  )}
                  {index === 0 ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                      Main Photo
                    </div>
                  ) : (
                    <button
                      className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 hover:bg-black/70 transition-colors w-full text-center"
                      onClick={() => handleSetMainPhoto(index)}
                    >
                      Set as Main
                    </button>
                  )}
                </div>
              ))}
              {profile.photos.length < 6 && (
                <button
                  className="aspect-square flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-white/10 bg-gray-700/20 hover:bg-gray-800 transition-colors"
                  onClick={() => setIsAddPhotoOpen(true)}
                >
                  <CirclePlusIcon
                    size={24}
                    strokeWidth={1.5}
                    className="text-gray-500 mb-1"
                  />
                  <span className="text-xs text-gray-400">Add Photo</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </LenisScroll>

      <Transition appear show={isEditProfileOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsEditProfileOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-background p-6 text-left align-middle shadow-xl transition-all border border-white/10">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-100"
                  >
                    Edit Profile
                  </Dialog.Title>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          value={profile.age}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              age: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Gender
                        </label>
                        <select
                          className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          value={profile.gender}
                          onChange={(e) =>
                            setProfile({ ...profile, gender: e.target.value })
                          }
                        >
                          <option className="bg-gray-800">Male</option>
                          <option className="bg-gray-800">Female</option>
                          <option className="bg-gray-800">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        About Me
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        value={profile.description}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Interests
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-900/50 text-violet-300"
                          >
                            {interest}
                            <button
                              type="button"
                              className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-violet-400 hover:bg-violet-800/50 focus:outline-none"
                              onClick={() => {
                                setProfile({
                                  ...profile,
                                  interests: profile.interests.filter(
                                    (_, i) => i !== index
                                  ),
                                });
                              }}
                            >
                              <span className="sr-only">Remove interest</span>
                              <XIcon size={12} />
                            </button>
                          </span>
                        ))}
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1 border border-white/10 rounded-full text-xs font-medium text-gray-400 hover:bg-gray-700"
                          onClick={() => {
                            const newInterest = prompt("Add new interest");
                            if (newInterest) {
                              setProfile({
                                ...profile,
                                interests: [...profile.interests, newInterest],
                              });
                            }
                          }}
                        >
                          <CirclePlusIcon size={12} className="mr-1" />
                          Add Interest
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none"
                      onClick={() => setIsEditProfileOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none"
                      onClick={handleSaveProfile}
                    >
                      Save Changes
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={isEditLookingForOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsEditLookingForOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-background p-6 text-left align-middle shadow-xl transition-all border border-white/10">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-100"
                  >
                    Looking For Preferences
                  </Dialog.Title>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Gender Preference
                      </label>
                      <select
                        className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        value={lookingFor.genderPreference}
                        onChange={(e) =>
                          setLookingFor({
                            ...lookingFor,
                            genderPreference: e.target.value,
                          })
                        }
                      >
                        <option className="bg-gray-800">Male</option>
                        <option className="bg-gray-800">Female</option>
                        <option className="bg-gray-800">Other</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Min Age
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          value={lookingFor.ageMin}
                          onChange={(e) =>
                            setLookingFor({
                              ...lookingFor,
                              ageMin: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Max Age
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          value={lookingFor.ageMax}
                          onChange={(e) =>
                            setLookingFor({
                              ...lookingFor,
                              ageMax: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none"
                      onClick={() => setIsEditLookingForOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none"
                      onClick={handleSaveLookingFor}
                    >
                      Save Changes
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={isAddPhotoOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsAddPhotoOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-background p-6 text-left align-middle shadow-xl transition-all border border-white/10">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-100"
                  >
                    Manage Photos
                  </Dialog.Title>

                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-4">
                      Upload up to 6 photos for your profile. First photo will
                      be used as your main profile picture.
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {profile.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group"
                        >
                          <Image
                            src={photo}
                            alt={`Gallery photo ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <button
                              className="rounded-full p-1 bg-gray-900/80 hover:bg-gray-900 shadow-sm"
                              onClick={() => {
                                const newPhotos = [...profile.photos];
                                newPhotos.splice(index, 1);
                                setProfile({ ...profile, photos: newPhotos });
                              }}
                            >
                              <XIcon size={14} className="text-gray-300" />
                            </button>
                          </div>
                          {index === 0 ? (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                              Main Photo
                            </div>
                          ) : (
                            <button
                              className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 hover:bg-black/70 transition-colors w-full text-center"
                              onClick={() => handleSetMainPhoto(index)}
                            >
                              Set as Main
                            </button>
                          )}
                        </div>
                      ))}
                      {profile.photos.length < 6 && (
                        <div
                          className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-white/10 bg-white/5 hover:bg-gray-700 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current.click()}
                        >
                          <CameraIcon
                            size={20}
                            className="text-gray-300 mb-1"
                          />
                          <span className="text-xs text-gray-300">
                            Add Photo
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none"
                      onClick={() => setIsAddPhotoOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none"
                      onClick={() => setIsAddPhotoOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
