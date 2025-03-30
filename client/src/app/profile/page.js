"use client";

import { useState, Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { CirclePlusIcon, XIcon, CameraIcon, Edit2Icon } from "lucide-react";
import Image from "next/image";
import LenisScroll from "@/components/LenisScroll";

export default function Profile(params) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditLookingForOpen, setIsEditLookingForOpen] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const fileInputRef = useRef();

  const [profile, setProfile] = useState({
    name: "Jessica Parker",
    age: 28,
    gender: "Female",
    location: "New York City",
    description:
      "Passionate about photography, hiking and discovering new coffee shops. Always up for an adventure or a good conversation.",
    lookingFor: {
      genderPreference: "Male",
      ageMin: 26,
      ageMax: 35,
      interests: ["Hiking", "Photography", "Travel", "Food"],
    },
    isOnline: true,
    lastActive: "2 hours ago",
    photos: [
      "https://images.unsplash.com/photo-1557296387-5358ad7997bb?q=80&w=1957&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1556942057-94aaf3ae5d6e?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1555325083-60f59dcd852d?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1553455303-5dc18c358c6d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newPhoto = event.target.result;
      setProfile((prev) => ({
        ...prev,
        photos: [...prev.photos, newPhoto],
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSetMainPhoto = (index) => {
    if (index === 0) return;

    const newPhotos = [...profile.photos];
    const [removed] = newPhotos.splice(index, 1);
    newPhotos.unshift(removed);
    setProfile({ ...profile, photos: newPhotos });
  };

  return (
    <div className="w-full h-full overflow-auto">
      <LenisScroll>
        <section className="flex flex-col gap-3 min-h-full p-4">
          <div className="bg-white ring-1 ring-gray-200 rounded-lg shadow-sm flex items-center">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg w-full">
              <div className="flex-shrink-0 relative">
                <Image
                  src={profile.photos[0]}
                  alt="Profile"
                  width={100}
                  height={100}
                  className="w-16 h-16 sm:w-18 sm:h-18 object-cover object-center rounded-3xl ring-2 ring-pink-500"
                />
                {profile.isOnline && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                )}
                <button
                  className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm cursor-pointer"
                  onClick={() => setIsAddPhotoOpen(true)}
                >
                  <Edit2Icon
                    size={16}
                    strokeWidth={1.5}
                    className="text-blue-500"
                  />
                </button>
              </div>
              <div className="flex-grow w-full">
                <div className="flex justify-between items-center">
                  <h1 className="text-lg font-medium">{profile.name}</h1>
                  <button
                    className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
                    onClick={() => setIsEditProfileOpen(true)}
                  >
                    Edit Profile
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <span>{profile.age}</span>
                  <span>•</span>
                  <span>{profile.gender}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {profile.description}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white ring-1 ring-gray-200 rounded-lg shadow-sm flex flex-col justify-center p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-medium text-gray-800">About Me</h2>
              <button
                className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
                onClick={() => setIsEditProfileOpen(true)}
              >
                Edit
              </button>
            </div>
            <p className="text-sm text-gray-600">{profile.description}</p>
          </div>
          <div className="bg-white ring-1 ring-gray-200 rounded-lg shadow-sm flex flex-col justify-center p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-medium text-gray-800">Looking For</h2>
              <button
                className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
                onClick={() => setIsEditLookingForOpen(true)}
              >
                Edit
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-24">Gender:</span>
                <span>{profile.lookingFor.genderPreference}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-24">Age Range:</span>
                <span>
                  {profile.lookingFor.ageMin} - {profile.lookingFor.ageMax}
                </span>
              </div>
              <div className="flex items-start text-sm text-gray-600">
                <span className="w-24 flex-shrink-0">Interests:</span>
                <div className="flex flex-wrap gap-1">
                  {profile.lookingFor.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white ring-1 ring-gray-200 rounded-lg shadow-sm flex flex-col justify-center p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-medium text-gray-800">Gallery</h2>
              <button
                className="text-sm text-blue-500 hover:underline cursor-pointer"
                onClick={() => setIsAddPhotoOpen(true)}
              >
                Manage Photos
              </button>
            </div>
            <div className="grid grid-cols-12 gap-3 overflow-auto w-full">
              {profile.photos.slice(1).map((photo, index) => (
                <div
                  key={index}
                  className="col-span-3 relative group h-42 w-full rounded-lg pattern border-2 border-dashed border-gray-200"
                >
                  <Image
                    src={photo}
                    alt={`Gallery photo ${index + 1}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-contain object-center rounded-lg"
                  />
                  <button
                    className="absolute top-0 right-0 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      const newPhotos = [...profile.photos];
                      newPhotos.splice(index + 1, 1);
                      setProfile({ ...profile, photos: newPhotos });
                    }}
                  >
                    <XIcon size={18} className="text-blue-500" />
                  </button>
                </div>
              ))}
              {profile.photos.length < 6 && (
                <button
                  className="col-span-3 flex items-center justify-center w-full h-42 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsAddPhotoOpen(true)}
                >
                  <CirclePlusIcon
                    size={20}
                    strokeWidth={1.5}
                    className="text-gray-400"
                  />
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
            <div className="fixed inset-0 bg-black/20" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Edit Profile
                  </Dialog.Title>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        className="mt-1 py-2 px-0 block w-full border-gray-300 border-b focus:border-blue-500 focus:ring-blue-500 sm:text-sm outline-0"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Age
                        </label>
                        <input
                          type="number"
                          className="mt-1 py-2 px-0 block w-full border-gray-300 border-b focus:border-blue-500 focus:ring-blue-500 sm:text-sm outline-0"
                          value={profile.age}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              age: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Gender
                        </label>
                        <select
                          className="mt-1 py-2 px-0 block w-full border-gray-300 border-b focus:border-blue-500 focus:ring-blue-500 sm:text-sm outline-0"
                          value={profile.gender}
                          onChange={(e) =>
                            setProfile({ ...profile, gender: e.target.value })
                          }
                        >
                          <option>Female</option>
                          <option>Male</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        About Me
                      </label>
                      <textarea
                        rows={3}
                        className="mt-1 py-2 px-0 block w-full border-gray-300 border-b focus:border-blue-500 focus:ring-blue-500 sm:text-sm outline-0"
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
                      <label className="block text-sm font-medium text-gray-700">
                        Interests
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.lookingFor.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {interest}
                            <button
                              type="button"
                              className="flex-shrink-0 ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                              onClick={() => {
                                const newInterests = [
                                  ...profile.lookingFor.interests,
                                ];
                                newInterests.splice(index, 1);
                                setProfile({
                                  ...profile,
                                  lookingFor: {
                                    ...profile.lookingFor,
                                    interests: newInterests,
                                  },
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
                          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-full text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                          onClick={() => {
                            const newInterest = prompt("Add new interest");
                            if (newInterest) {
                              setProfile({
                                ...profile,
                                lookingFor: {
                                  ...profile.lookingFor,
                                  interests: [
                                    ...profile.lookingFor.interests,
                                    newInterest,
                                  ],
                                },
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
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none"
                      onClick={() => setIsEditProfileOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
                      onClick={() => setIsEditProfileOpen(false)}
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
            <div className="fixed inset-0 bg-black/20" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Looking For Preferences
                  </Dialog.Title>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Gender Preference
                      </label>
                      <select
                        className="mt-1 py-2 px-0 block w-full border-gray-300 border-b focus:border-blue-500 focus:ring-blue-500 sm:text-sm outline-0"
                        value={profile.lookingFor.genderPreference}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            lookingFor: {
                              ...profile.lookingFor,
                              genderPreference: e.target.value,
                            },
                          })
                        }
                      >
                        <option>Female</option>
                        <option>Male</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Min Age
                        </label>
                        <input
                          type="number"
                          className="mt-1 py-2 px-0 block w-full border-gray-300 border-b focus:border-blue-500 focus:ring-blue-500 sm:text-sm outline-0"
                          value={profile.lookingFor.ageMin}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              lookingFor: {
                                ...profile.lookingFor,
                                ageMin: parseInt(e.target.value),
                              },
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Max Age
                        </label>
                        <input
                          type="number"
                          className="mt-1 py-2 px-0 block w-full border-gray-300 border-b focus:border-blue-500 focus:ring-blue-500 sm:text-sm outline-0"
                          value={profile.lookingFor.ageMax}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              lookingFor: {
                                ...profile.lookingFor,
                                ageMax: parseInt(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none"
                      onClick={() => setIsEditLookingForOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
                      onClick={() => setIsEditLookingForOpen(false)}
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
            <div className="fixed inset-0 bg-black/20" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Manage Photos
                  </Dialog.Title>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Upload up to 4 photos for your profile. First photo will
                      be used as your main profile picture.
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {profile.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative group rounded-lg overflow-hidden border border-gray-200"
                        >
                          <Image
                            src={photo}
                            alt={`Gallery photo ${index + 1}`}
                            width={120}
                            height={120}
                            className="w-full h-24 object-cover"
                          />
                          <div className="absolute top-1 right-1">
                            <button
                              className="bg-white rounded-full p-1 shadow-sm"
                              onClick={() => {
                                const newPhotos = [...profile.photos];
                                newPhotos.splice(index, 1);
                                setProfile({ ...profile, photos: newPhotos });
                              }}
                            >
                              <XIcon size={14} className="text-gray-600" />
                            </button>
                          </div>
                          {index === 0 ? (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 text-center">
                              Main Photo
                            </div>
                          ) : (
                            <button
                              className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 hover:bg-opacity-70 transition-colors"
                              onClick={() => handleSetMainPhoto(index)}
                            >
                              Set as Main
                            </button>
                          )}
                        </div>
                      ))}
                      {profile.photos.length < 4 && (
                        <div
                          className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current.click()}
                        >
                          <CameraIcon
                            size={20}
                            className="text-gray-400 mb-1"
                          />
                          <span className="text-xs text-gray-500">
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
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none"
                      onClick={() => setIsAddPhotoOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
                      onClick={() => setIsAddPhotoOpen(false)}
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
    </div>
  );
}
