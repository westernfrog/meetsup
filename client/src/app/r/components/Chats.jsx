import { Check, CheckCheck } from "lucide-react";
import Image from "next/image";

export default function Chats() {
  const placeholderMessages = [
    {
      id: 1,
      text: "Hey! Just joined this chat room 👋",
      sender: "other",
      timestamp: "2:30 PM",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=ShadowQuartz",
    },
    {
      id: 2,
      text: "Welcome! How are you doing today?",
      sender: "self",
      timestamp: "2:32 PM",
      status: "read", // read, delivered, sent
    },
    {
      id: 3,
      text: "I'm doing great, thanks for asking! This chat interface looks really nice 😊",
      sender: "other",
      timestamp: "2:35 PM",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=ShadowQuartz",
    },
    {
      id: 4,
      text: "Thank you! I'm glad you like it. The design is clean and modern.",
      sender: "self",
      timestamp: "2:37 PM",
      status: "delivered",
    },
    {
      id: 5,
      text: "Absolutely! The pink theme is really elegant too.",
      sender: "other",
      timestamp: "2:38 PM",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=ShadowQuartz",
    },
    {
      id: 6,
      text: "I appreciate the feedback! Let me know if you have any suggestions for improvements.",
      sender: "self",
      timestamp: "2:40 PM",
      status: "sent",
    },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case "read":
        return <CheckCheck className="w-4 heelo h-4 text-emerald-500" />;
      case "delivered":
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case "sent":
        return <Check className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }

  };

  return (
    <section className="overflow-y-auto h-full">
      <div className="max-w-3xl mx-auto h-full">
        {placeholderMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
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
          <div className="flex flex-col gap-3">
            {placeholderMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === "self" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex flex-col max-w-2xl">
                  <div
                    className={`px-6 py-6 rounded-xl ${
                      message.sender === "other"
                        ? "border text-gray-300 rounded-tl-none"
                        : "bg-pink-900 shadow-inner rounded-tr-none"
                    }`}
                  >
                    <p className="leading-relaxed tracking-wide">
                      {message.text}
                    </p>
                  </div>

                  <div
                    className={`flex items-center gap-2 mt-2 px-2 ${
                      message.sender === "self"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <span className="text-xs text-gray-500">
                      {message.timestamp}
                    </span>
                    {message.sender === "self" && getStatusIcon(message.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
