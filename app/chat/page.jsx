"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chatStore";
import { chatAPI } from "@/lib/api";
import { Card, CardContent } from "../_components/ui/card";
import { Button } from "../_components/ui/button";
import { Input } from "../_components/ui/input";
import { MessageSquare, Send } from "lucide-react";

export default function ChatPage() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();
  const { chats, setChats, activeChat, setActiveChat, messages, setMessages, addMessage } = useChatStore();
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }

    if (isSignedIn && userId) {
      loadChats();
    }
  }, [isSignedIn, isLoaded, userId]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat]);

  const loadChats = async () => {
    try {
      const data = await chatAPI.getUserChats(userId);
      setChats(data);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const data = await chatAPI.getMessages(chatId);
      setMessages(chatId, data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeChat) return;

    try {
      const newMessage = await chatAPI.sendMessage(activeChat, {
        userId,
        content: messageText,
      });
      
      addMessage(activeChat, newMessage);
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!isLoaded) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Chat List */}
        <Card className="overflow-y-auto">
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Conversations</h2>
            </div>
            <div className="divide-y">
              {chats.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No conversations yet
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      activeChat === chat.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        {chat.participant?.username?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {chat.participant?.username || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage || "No messages"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="md:col-span-2 flex flex-col">
          {activeChat ? (
            <>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages[activeChat]?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.userId === userId ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.userId === userId
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.userId === userId
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
              
              <CardContent className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Select a conversation to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

