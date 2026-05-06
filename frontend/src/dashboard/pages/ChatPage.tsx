import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { FaPaperPlane, FaUserCircle, FaInbox, FaCircle } from "react-icons/fa";
import { useGetMyChatRoomsQuery, useGetChatMessagesQuery } from "../../redux/api/chatApi";
import { useSocket } from "../../hooks/useSocket";
import { getUserLocalStorage } from "../../auth/auth";
import { format } from "date-fns";

const ChatPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRoomId = searchParams.get("roomId");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const token = getUserLocalStorage();
  const { socket, isConnected } = useSocket({ autoConnect: true, token: token || "" });
  const { data: roomsData, isLoading: roomsLoading } = useGetMyChatRoomsQuery(undefined);
  const { data: initialMessages, isLoading: messagesLoading } = useGetChatMessagesQuery(activeRoomId, {
    skip: !activeRoomId,
  });

  const rooms = roomsData?.data || [];
  const currentRoom = rooms.find((r: any) => r.id === activeRoomId);
  const currentUser = JSON.parse(atob(token?.split(".")[1] || "{}"));

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    socket.on("message-received", (newMessage: any) => {
      if (newMessage.chatRoomId === activeRoomId) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    return () => {
      socket.off("message-received");
    };
  }, [socket, activeRoomId]);

  // Handle room joining
  useEffect(() => {
    if (socket && activeRoomId && isConnected) {
      socket.emit("join-chat", activeRoomId);
    }
    return () => {
      if (socket && activeRoomId) {
        socket.emit("leave-chat", activeRoomId);
      }
    };
  }, [socket, activeRoomId, isConnected]);

  // Load initial messages
  useEffect(() => {
    if (initialMessages?.data) {
      setMessages(initialMessages.data);
    }
  }, [initialMessages]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeRoomId || !socket) return;

    socket.emit("send-message", {
      chatRoomId: activeRoomId,
      content: message,
    });
    setMessage("");
  };

  const getOtherParticipant = (room: any) => {
    const otherId = room.participants.find((id: string) => id !== currentUser.id);
    // In a real app, you'd fetch the user's name/img. For now, we'll label them "Participant"
    return { name: "Community Member", id: otherId };
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-gray-900 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
      {/* Rooms Sidebar */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-gray-900/50">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <FaInbox className="text-cyan-400" /> Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {roomsLoading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div></div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm italic">No conversations yet.</div>
          ) : (
            rooms.map((room: any) => {
              const other = getOtherParticipant(room);
              const isActive = room.id === activeRoomId;
              const lastMsg = room.messages?.[0];
              return (
                <button
                  key={room.id}
                  onClick={() => setSearchParams({ roomId: room.id })}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                    isActive ? "bg-cyan-500/10 border border-cyan-500/20" : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-white/5">
                    <FaUserCircle className="text-gray-600 text-2xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-gray-300"}`}>
                      Item: {room.claim?.foundItem?.foundItemName || "Lost Item"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{lastMsg?.content || "No messages yet"}</p>
                  </div>
                  {isActive && <FaCircle className="text-cyan-400 w-2 h-2" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-950/20">
        {activeRoomId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-gray-900/30 flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Chat regarding: {currentRoom?.claim?.foundItem?.foundItemName}</h3>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-500"}`}></span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">{isConnected ? "Connected" : "Disconnected"}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div></div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-lg ${
                        isMe ? "bg-cyan-600 text-white rounded-br-none" : "bg-gray-800 text-gray-100 rounded-bl-none border border-white/5"
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 opacity-60 ${isMe ? "text-right" : "text-left"}`}>
                          {format(new Date(msg.createdAt), "p")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-gray-900/30">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-gray-800 border border-white/10 text-white text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="absolute right-2 p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50"
                >
                  <FaPaperPlane size={14} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50">
            <FaInbox size={48} className="mb-4" />
            <p className="text-lg font-medium">Select a conversation to start chatting</p>
            <p className="text-sm">Communicate securely with other campus members</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
