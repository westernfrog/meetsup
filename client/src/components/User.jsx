import Image from "next/image";
import Link from "next/link";

export default function User({
  name,
  profileImage,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isOnline,
  link = "/",
}) {
  return (
    <Link
      href={link}
      className="flex items-center gap-3 w-full text-sm hover:bg-blue-50 px-5 py-4 transition duration-300 ease-in-out cursor-pointer group"
    >
      <div className="flex-shrink-0 relative">
        <Image
          src={profileImage}
          alt={name}
          width={40}
          height={40}
          className="rounded-2xl w-10 h-10 object-cover object-center ring-2 ring-pink-500"
        />
        {isOnline && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-center w-full">
          <span className="font-medium">{name}</span>
          <span className="text-xs text-gray-500">{lastMessageTime}</span>
        </div>
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-gray-600 truncate max-w-[240px]">
            {lastMessage}...
          </span>
          {unreadCount > 0 && (
            <div className="flex items-center">
              <span className="bg-blue-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
