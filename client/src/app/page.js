"use client";

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import LenisScroll from "@/components/LenisScroll";
import { ImageIcon, MicIcon, SendIcon } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [partnerFound, setPartnerFound] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState("online");
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
    );
    setSocket(socketRef.current);

    socketRef.current.on("partnerFound", ({ roomId, partnerId }) => {
      setIsSearching(false);
      setPartnerFound(true);
      setRoomId(roomId);
      setPartnerId(partnerId);
      setPartnerStatus("online");
    });

    socketRef.current.on("receiveMessage", (message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          sender: message.senderId === socketRef.current.id ? "me" : "partner",
          time: new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    });

    socketRef.current.on("partnerTyping", () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 5000);
    });

    socketRef.current.on("partnerDisconnected", () => {
      setMessages((prev) => [
        ...prev,
        {
          text: "Partner has disconnected from the chat.",
          senderId: "system",
          sender: "system",
          timestamp: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setPartnerStatus("offline");
      setTimeout(() => {
        setPartnerFound(false);
        setPartnerId("");
        setRoomId("");
        setMessages([]);
      }, 20000);
    });

    socketRef.current.on("disconnect", () => {
      setPartnerStatus("offline");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleFindPartner = () => {
    if (!isSearching) {
      setIsSearching(true);
      socketRef.current.emit("findPartner");
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !roomId || partnerStatus === "offline") return;

    const newMessage = {
      text: messageInput,
      senderId: socketRef.current.id,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    socketRef.current.emit("sendMessage", { roomId, message: newMessage });
    setMessageInput("");
  };

  const handleDisconnect = () => {
    socketRef.current.emit("leaveRoom", roomId);
    setPartnerFound(false);
    setPartnerId("");
    setRoomId("");
    setMessages([]);
    setPartnerStatus("online");
  };

  const handleTyping = () => {
    if (roomId && partnerStatus === "online") {
      socketRef.current.emit("typing", roomId);
    }
  };

  if (!partnerFound) {
    return (
      <div className="flex items-center justify-center h-full">
        <button
          onClick={handleFindPartner}
          disabled={isSearching}
          className={`px-6 py-3 rounded-lg text-lg transition duration-300 ease-in-out ${
            isSearching
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white shadow-md"
          }`}
        >
          {isSearching ? "Searching for partner..." : "Find Random Partner"}
        </button>
      </div>
    );
  }

  return (
    <section className="relative flex flex-col overflow-auto h-full">
      <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center gap-3 w-full text-sm cursor-pointer group">
          <div className="relative">
            <Image
              src="https://images.unsplash.com/photo-1728887823143-d92d2ebbb53a?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="User"
              width={40}
              height={40}
              className="rounded-2xl w-10 h-10 object-cover object-center ring-2 ring-pink-500"
            />
            <div
              className={`absolute -top-1 -right-1 w-3.5 h-3.5 ${
                partnerStatus === "online" ? "bg-green-500" : "bg-red-500"
              } rounded-full border-2 border-white`}
            ></div>
          </div>
          <div className="flex flex-col flex-grow">
            <div className="flex justify-between items-center w-full">
              <span className="font-medium">Anonymous: {partnerId}</span>
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-gray-600 truncate max-w-[240px]">
                {isTyping
                  ? "Typing..."
                  : partnerStatus === "online"
                  ? "Online"
                  : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 w-full">
          <div className="group">
            <button className="bg-blue-100 hover:bg-blue-500 ring-1 ring-blue-500 text-blue-500 hover:text-white px-3 py-3 transition duration-300 ease-in-out rounded-lg flex items-center gap-2 text-xs">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Add Friend
            </button>
          </div>
          <button
            onClick={handleDisconnect}
            className="bg-rose-100 hover:bg-rose-400 ring-1 ring-rose-400 text-rose-400 hover:text-white px-3 py-3 transition duration-300 ease-in-out rounded-lg flex items-center gap-2 text-xs"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Disconnect
          </button>
        </div>
      </div>
      <LenisScroll>
        <div className="flex-1 p-4 space-y-4 pattern h-full">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.sender === "me"
                  ? "justify-end"
                  : message.sender === "system"
                  ? "justify-center"
                  : "justify-start"
              } items-start gap-2`}
            >
              {message.sender === "system" ? (
                <div className="bg-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 max-w-[80%]">
                  {message.text}
                </div>
              ) : (
                <div className="max-w-[50%] min-w-20">
                  <div
                    className={`rounded-2xl p-3 shadow-sm shadow-gray-300 ${
                      message.sender === "me" ? "bg-blue-200" : "bg-white"
                    }`}
                  >
                    <p className="text-sm leading-6">{message.text}</p>
                  </div>
                  <div className="text-[10px] mt-1 text-end text-gray-700">
                    <span className="uppercase">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </LenisScroll>
      {partnerStatus === "online" ? (
        <div className="flex-1 rounded-b-lg border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2 p-4">
            <button className="bg-gray-100 hover:bg-gray-200 ring-1 ring-gray-200 rounded-2xl p-2 transition duration-300 ease-in-out w-10 h-10 flex items-center justify-center cursor-pointer">
              <MicIcon
                size={22}
                strokeWidth={1.5}
                className="stroke-gray-600"
              />
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyUp={(e) => e.key === "Enter" && handleSendMessage()}
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
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 hover:bg-blue-600 rounded-2xl p-2 transition duration-300 ease-in-out w-10 h-10 flex items-center justify-center cursor-pointer"
            >
              <SendIcon
                size={22}
                strokeWidth={1.5}
                className="stroke-gray-100"
              />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 rounded-b-lg border-t border-gray-200 bg-white">
          <div className="flex items-center justify-center p-6">
            <p className="text-gray-500 text-sm">
              This chat has ended. Find a new partner to continue chatting.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
