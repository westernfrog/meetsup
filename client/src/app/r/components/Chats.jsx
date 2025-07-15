"use client";

import { Check, CheckCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

export default function Chats({ messages, currentUser }) {
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Scroll immediately
    scrollToBottom();

    // Also scroll after a short delay to handle images loading
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);

  const getStatusIcon = (seen) => {
    if (seen) {
      return <CheckCheck className="w-4 h-4 text-emerald-500" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleImageLoad = () => {
    // Scroll to bottom when images finish loading
    scrollToBottom();
  };

  return (
    <section
      ref={scrollContainerRef}
      className="overflow-y-auto h-full my-10 scroll-smooth"
    >
      <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">
        {messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
            <div className="rounded-full p-6 mb-4">
              <Image
                src="https://cdn-icons-png.flaticon.com/512/724/724715.png"
                width={200}
                height={200}
                alt="MailBox"
                className="w-28 h-28 object-center object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Send a message to get the conversation started. Your messages will
              appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 px-4 pb-4">
            {messages?.map((message, index) => {
              const isCurrentUser = message.senderId === currentUser?.id;
              const isLastMessage = index === messages.length - 1;
              const nextMessage = messages[index + 1];
              const isLastFromSender =
                !nextMessage || nextMessage.senderId !== message.senderId;

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  } mb-1`}
                >
                  <div
                    className={`flex flex-col max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${
                      isCurrentUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-3 rounded-2xl relative ${
                        message.type === "IMAGE"
                          ? "p-0"
                          : isCurrentUser
                          ? "bg-pink-900 shadow-inner"
                          : "border text-gray-300"
                      } ${
                        isCurrentUser
                          ? isLastFromSender
                            ? "rounded-br-md"
                            : "rounded-br-2xl"
                          : isLastFromSender
                          ? "rounded-bl-md"
                          : "rounded-bl-2xl"
                      }`}
                    >
                      {(message.type === "TEXT" ||
                        message.type === "TEXT_IMAGE") && (
                        <p className="leading-relaxed tracking-wide text-sm break-words">
                          {message.content}
                        </p>
                      )}
                      {(message.type === "IMAGE" ||
                        message.type === "TEXT_IMAGE") && (
                        <div className={message.content ? "mt-2" : ""}>
                          <img
                            src={message.imageId}
                            alt="Sent Image"
                            className="w-96 h-full object-contain rounded-lg shadow-sm"
                            loading="lazy"
                            onLoad={handleImageLoad}
                          />
                        </div>
                      )}
                    </div>

                    {isLastFromSender && (
                      <div
                        className={`flex items-center gap-2 mt-1 px-2 ${
                          isCurrentUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isCurrentUser && getStatusIcon(message.seen)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </section>
  );
}
