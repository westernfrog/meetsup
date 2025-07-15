"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Paperclip, Send, X, StopCircle } from "lucide-react";
import { useState, useRef } from "react";

export default function MessageInput({ onSendMessage, socket, roomId, currentUser }) {
  const [selectedImages, setSelectedImages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage = {
            id: Date.now() + Math.random(),
            file: file,
            preview: e.target?.result,
            name: file.name,
          };
          setSelectedImages((prev) => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (event.target) {
      event.target.value = "";
    }
  };

  const removeImage = (imageId) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    if (socket && roomId && currentUser) {
      if (e.target.value.length > 0) {
        socket.emit("typing:start");
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit("typing:stop");
        }, 3000); // Stop typing after 3 seconds of inactivity
      } else {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        socket.emit("typing:stop");
      }
    }
  };

  const handleSend = () => {
    if (message.trim() || selectedImages.length > 0) {
      onSendMessage(message, selectedImages);
      setMessage("");
      setSelectedImages([]);
      if (socket && roomId && currentUser) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        socket.emit("typing:stop");
      }
    }
  };

  return (
    <section className="max-w-4xl mx-auto w-full mb-3">
      <div className="flex flex-col items-center gap-2">
        <div className="w-full">
          {selectedImages.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-3">
                {selectedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-border">
                      <img
                        src={image.preview}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("Image load error:", e);
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive/80"
                    >
                      <X size={14} className="text-white" />
                    </button>
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded truncate">
                        {image.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isRecording && (
            <div className="mb-4">
              <div className="flex items-center justify-center gap-3 p-4 bg-secondary rounded-2xl border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="relative border rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-secondary">
            <div className="p-4">
              <Input
                placeholder="Type your message here..."
                value={message}
                onChange={handleMessageChange}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="border-none focus:ring-0 focus:outline-none resize-none leading-relaxed placeholder:text-gray-400 placeholder:tracking-wide placeholder:text-base"
              />
            </div>
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="rounded-full w-10 h-10 hover:bg-accent transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={18} />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className={`rounded-full w-10 h-10 transition-all duration-200 ${
                    isRecording
                      ? "bg-red-950 hover:bg-red-900 border-none"
                      : "hover:bg-accent"
                  }`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <StopCircle size={18} className="text-red-500" />
                  ) : (
                    <Mic size={18} />
                  )}
                </Button>
              </div>
              <Button
                onClick={handleSend}
                disabled={!message.trim() && selectedImages.length === 0}
                className="h-10 w-10 rounded-full shadow hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} className="text-white" />
              </Button>
            </div>
          </div>
        </div>
        <p className="text-gray-500 text-sm text-center max-w-md">
          Be respectful and follow the chat rules
        </p>
      </div>
    </section>
  );
}
