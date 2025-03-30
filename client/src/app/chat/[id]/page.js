import LenisScroll from "@/components/LenisScroll";
import {
  EllipsisVerticalIcon,
  ImageIcon,
  MicIcon,
  SendIcon,
} from "lucide-react";
import Image from "next/image";

export default function ChatId() {
  const messages = [
    {
      id: 1,
      text: "Hey there! 👋",
      sender: "Arushi",
      time: "09:30",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 2,
      text: "Hi! How's it going?",
      sender: "me",
      time: "09:31",
    },
    {
      id: 3,
      text: "Pretty good! Want to grab coffee later?",
      sender: "Arushi",
      time: "09:32",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 4,
      text: "Sure, 3pm work for you?",
      sender: "me",
      time: "09:33",
    },
    {
      id: 5,
      text: "Perfect! See you then ☕",
      sender: "Arushi",
      time: "09:34",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 6,
      text: "By the way, did you finish the project we were working on?",
      sender: "Arushi",
      time: "09:35",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 7,
      text: "Almost done! Just need to finalize the last section.",
      sender: "me",
      time: "09:36",
    },
    {
      id: 8,
      text: "That's great news! Let me know if you need any help with it.",
      sender: "Arushi",
      time: "09:37",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 9,
      text: "Will do! Thanks for checking in 😊",
      sender: "me",
      time: "09:38",
    },
    {
      id: 10,
      text: "No problem at all! Let's make sure we're ready for the presentation tomorrow.",
      sender: "Arushi",
      time: "09:39",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 11,
      text: "I've attached the updated design files for your review.",
      sender: "Arushi",
      time: "09:40",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 12,
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      sender: "me",
      time: "09:41",
    },
    {
      id: 13,
      text: "Great! Let me know your thoughts when you're done.",
      sender: "Arushi",
      time: "09:42",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 1,
      text: "Hey there! 👋",
      sender: "Arushi",
      time: "09:30",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 2,
      text: "Hi! How's it going?",
      sender: "me",
      time: "09:31",
    },
    {
      id: 3,
      text: "Pretty good! Want to grab coffee later?",
      sender: "Arushi",
      time: "09:32",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 4,
      text: "Sure, 3pm work for you?",
      sender: "me",
      time: "09:33",
    },
    {
      id: 5,
      text: "Perfect! See you then ☕",
      sender: "Arushi",
      time: "09:34",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 6,
      text: "By the way, did you finish the project we were working on?",
      sender: "Arushi",
      time: "09:35",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 7,
      text: "Almost done! Just need to finalize the last section.",
      sender: "me",
      time: "09:36",
    },
    {
      id: 8,
      text: "That's great news! Let me know if you need any help with it.",
      sender: "Arushi",
      time: "09:37",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 9,
      text: "Will do! Thanks for checking in 😊",
      sender: "me",
      time: "09:38",
    },
    {
      id: 10,
      text: "No problem at all! Let's make sure we're ready for the presentation tomorrow.",
      sender: "Arushi",
      time: "09:39",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 11,
      text: "I've attached the updated design files for your review.",
      sender: "Arushi",
      time: "09:40",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 12,
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      sender: "me",
      time: "09:41",
    },
    {
      id: 13,
      text: "Great! Let me know your thoughts when you're done.",
      sender: "Arushi",
      time: "09:42",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];

  return (
    <section className="relative flex flex-col overflow-auto h-full">
      <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center gap-3 w-full text-sm cursor-pointer group">
          <div className="relative">
            <Image
              src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="User"
              width={40}
              height={40}
              className="rounded-2xl w-10 h-10 object-cover object-center ring-2 ring-pink-500"
            />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex flex-col flex-grow">
            <div className="flex justify-between items-center w-full">
              <span className="font-medium">Arushi Kumari (F, 26)</span>
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-gray-600 truncate max-w-[240px]">
                Typing...
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="hover:bg-gray-100 transition duration-300 ease-in-out w-10 h-10 rounded-2xl font-medium flex items-center justify-center">
            <EllipsisVerticalIcon
              size={22}
              strokeWidth={1.5}
              className="flex-shrink-0 stroke-gray-600"
            />
          </button>
        </div>
      </div>
      <LenisScroll>
        <div className="flex-1 p-4 space-y-4 pattern">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.sender === "me" ? "justify-end" : "justify-start"
              } items-start gap-2`}
            >
              <div className="max-w-[50%]">
                <div
                  className={`rounded-2xl p-3 shadow-sm shadow-gray-300 ${
                    message.sender === "me" ? "bg-blue-200" : "bg-white"
                  }`}
                >
                  <p className="text-sm leading-6">{message.text}</p>
                </div>
                <div className="text-xs mt-1 px-2 text-end text-gray-700">
                  <span>{message.time} AM</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </LenisScroll>
      <div className="flex-1 rounded-b-lg border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2 p-4">
          <button className="bg-gray-100 hover:bg-gray-200 ring-1 ring-gray-200 rounded-2xl p-2 transition duration-300 ease-in-out w-10 h-10 flex items-center justify-center cursor-pointer">
            <MicIcon size={22} strokeWidth={1.5} className="stroke-gray-600" />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 focus:outline-none focus:border-blue-500 text-sm mx-2"
          />
          <button className="bg-gray-100 hover:bg-gray-200 ring-1 ring-gray-200 rounded-2xl p-2 transition duration-300 ease-in-out w-10 h-10 flex items-center justify-center cursor-pointer">
            <ImageIcon
              size={22}
              strokeWidth={1.5}
              className="stroke-gray-600"
            />
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 rounded-2xl p-2 transition duration-300 ease-in-out w-10 h-10 flex items-center justify-center cursor-pointer">
            <SendIcon size={22} strokeWidth={1.5} className="stroke-gray-100" />
          </button>
        </div>
      </div>
    </section>
  );
}
