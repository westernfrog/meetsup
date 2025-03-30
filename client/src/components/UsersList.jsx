import { SearchIcon, UserRoundSearchIcon } from "lucide-react";
import User from "./User";
import LenisScroll from "./LenisScroll";
import Link from "next/link";

const demoUsers = [
  {
    id: 1,
    name: "Arushi Kumari",
    profileImage:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    lastMessage: "Hey! How's it going?",
    lastMessageTime: "12:45 PM",
    unreadCount: 3,
    isOnline: true,
    link: "/chat/1",
  },
  {
    id: 2,
    name: "Rahul Sharma",
    profileImage:
      "https://images.unsplash.com/photo-1674123894247-b635dfe990c5?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    lastMessage: "Let's catch up later!",
    lastMessageTime: "11:30 AM",
    unreadCount: 0,
    isOnline: false,
    link: "/chat/2",
  },
  {
    id: 3,
    name: "Emily Johnson",
    profileImage:
      "https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    lastMessage: "Meeting at 3 PM, right?",
    lastMessageTime: "10:15 AM",
    unreadCount: 1,
    isOnline: true,
    link: "/chat/3",
  },
  {
    id: 4,
    name: "Michael Brown",
    profileImage:
      "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?q=80&w=1972&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    lastMessage: "Thanks for the update!",
    lastMessageTime: "09:45 AM",
    unreadCount: 2,
    isOnline: false,
    link: "/chat/4",
  },
  {
    id: 5,
    name: "Sophia Wilson",
    profileImage:
      "https://images.unsplash.com/photo-1592621385612-4d7129426394?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dg",
    lastMessage: "Haha, that's funny!",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    isOnline: true,
    link: "/chat/5",
  },
];

export default function UsersList() {
  return (
    <section className="xl:col-span-3 md:col-span-4 row-span-20 bg-primary rounded-lg ring-1 ring-gray-200 flex flex-col h-full">
      <div className="flex flex-col items-center justify-between gap-2 mx-4 mt-4 mb-2">
        <Link
          href="/"
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition duration-300 ease-in-out text-sm w-full"
        >
          <UserRoundSearchIcon size={18} />
          <span>Find Random Partner</span>
        </Link>
        <div className="group flex items-center gap-2 ring-1 ring-gray-300 px-3 rounded-lg focus-within:ring-1 focus-within:ring-gray-400 transition duration-300 ease-in-out w-full bg-gray-100">
          <SearchIcon size={16} className="stroke-gray-500" />
          <input
            type="text"
            className="py-2 outline-0 placeholder:text-sm placeholder:text-gray-500 w-full"
            placeholder="Search Friends..."
          />
        </div>
      </div>
      <LenisScroll>
        <div className="flex flex-col items-start transition-colors cursor-pointer overflow-y-auto flex-1">
          {demoUsers.map((user) => (
            <User key={user.id} {...user} />
          ))}
        </div>
      </LenisScroll>
    </section>
  );
}
