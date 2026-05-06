import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { FaPaperPlane, FaUserCircle, FaInbox, FaCircle, FaArrowLeft } from "react-icons/fa";
import { useGetMyChatRoomsQuery, useGetChatMessagesQuery, useMarkAsReadMutation } from "../../redux/api/chatApi";
import { useSocket } from "../../hooks/useSocket";
import { getUserLocalStorage } from "../../auth/auth";
import { format } from "date-fns";

const ChatPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRoomId = searchParams.get("roomId");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(!activeRoomId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const token = getUserLocalStorage();
  const { socket, isConnected } = useSocket({ autoConnect: true, token: token || "" });
  const { data: roomsData, isLoading: roomsLoading } = useGetMyChatRoomsQuery(undefined);
  const { data: initialMessages, isLoading: messagesLoading } = useGetChatMessagesQuery(activeRoomId, {
    skip: !activeRoomId,
  });
  const [markAsRead] = useMarkAsReadMutation();

  const rooms = roomsData?.data || [];
  const currentRoom = rooms.find((r: any) => r.id === activeRoomId);
  const currentUser = JSON.parse(atob(token?.split(".")[1] || "{}"));
  const unreadCount = rooms.filter((room: any) => {
    const lastMsg = room.messages?.[0];
    const lastReadAt = room.readStatuses?.[0]?.lastReadAt;
    return lastMsg && (!lastReadAt || new Date(lastMsg.createdAt) > new Date(lastReadAt)) && lastMsg.senderId !== currentUser.id;
  }).length;

  useEffect(() => {
    if (activeRoomId) {
      markAsRead(activeRoomId);
    }
  }, [activeRoomId, markAsRead]);

  useEffect(() => {
    if (!socket) return;
    socket.on("message-received", (newMessage: any) => {
      if (newMessage.chatRoomId === activeRoomId) {
        setMessages((prev) => [...prev, newMessage]);
        markAsRead(activeRoomId); // Also mark as read if we are in the room
      }
    });
    return () => { socket.off("message-received"); };
  }, [socket, activeRoomId, markAsRead]);

  useEffect(() => {
    if (socket && activeRoomId && isConnected) {
      socket.emit("join-chat", activeRoomId);
    }
    return () => {
      if (socket && activeRoomId) socket.emit("leave-chat", activeRoomId);
    };
  }, [socket, activeRoomId, isConnected]);

  useEffect(() => {
    if (initialMessages?.data) setMessages(initialMessages.data);
  }, [initialMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // On mobile, show chat when room selected
  const handleSelectRoom = (roomId: string) => {
    setSearchParams({ roomId });
    setShowSidebar(false);
  };

  const handleBack = () => {
    setShowSidebar(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeRoomId || !socket) return;
    socket.emit("send-message", { chatRoomId: activeRoomId, content: message });
    setMessage("");
  };

  const getInitials = (name: string) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="flex h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] bg-gray-900 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">

      {/* ── Sidebar ── */}
      <div className={`
        ${showSidebar ? "flex" : "hidden"} sm:flex
        w-full sm:w-72 lg:w-80
        border-r border-white/5 flex-col bg-gray-900/50 shrink-0
      `}>
        {/* Sidebar Header */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2.5">
          <FaInbox className="text-blue-400" size={13} />
          <h2 className="text-white font-bold text-sm">Messages</h2>
          {unreadCount > 0 && (
            <span className="ml-auto text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 custom-scrollbar">
          {roomsLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-white/5 flex items-center justify-center mb-3">
                <FaInbox className="text-gray-600" size={18} />
              </div>
              <p className="text-gray-500 text-xs font-medium">No conversations yet</p>
              <p className="text-gray-600 text-[11px] mt-1">Your chats will appear here</p>
            </div>
          ) : (
            rooms.map((room: any) => {
              const isActive = room.id === activeRoomId;
              const lastMsg  = room.messages?.[0];
              const itemName = room.claim?.foundItem?.foundItemName || "Lost Item";
              
              // Unread logic
              const lastReadAt = room.readStatuses?.[0]?.lastReadAt;
              const hasUnread = lastMsg && (!lastReadAt || new Date(lastMsg.createdAt) > new Date(lastReadAt)) && lastMsg.senderId !== currentUser.id;

              return (
                <button key={room.id} onClick={() => handleSelectRoom(room.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                    isActive
                      ? "bg-blue-500/10 border border-blue-500/20"
                      : "hover:bg-white/5 border border-transparent hover:border-white/5"
                  }`}>
                  <div className="w-9 h-9 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center shrink-0 relative">
                    <FaUserCircle className="text-gray-500" size={20} />
                    {hasUnread && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 border-2 border-gray-900 rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive || hasUnread ? "text-white" : "text-gray-300"}`}>
                      {itemName}
                    </p>
                    <p className={`text-[11px] truncate mt-0.5 ${hasUnread ? "text-blue-400 font-medium" : "text-gray-500"}`}>
                      {lastMsg?.content || "No messages yet"}
                    </p>
                  </div>
                  {isActive && <FaCircle className="text-blue-400 shrink-0" size={6} />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className={`
        ${!showSidebar ? "flex" : "hidden"} sm:flex
        flex-1 flex-col bg-gray-950/20 min-w-0
      `}>
        {activeRoomId ? (
          <>
            {/* Chat Header */}
            <div className="px-3 sm:px-4 py-3 border-b border-white/5 bg-gray-900/40 flex items-center gap-3 shrink-0">
              {/* Back button — mobile only */}
              <button onClick={handleBack}
                className="sm:hidden w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0">
                <FaArrowLeft size={12} />
              </button>

              <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center shrink-0">
                <FaUserCircle className="text-gray-500" size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold truncate">
                  {currentRoom?.claim?.foundItem?.foundItemName || "Chat"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConnected ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 custom-scrollbar">
              {messagesLoading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-white/5 flex items-center justify-center mb-3">
                    <FaInbox className="text-gray-600" size={18} />
                  </div>
                  <p className="text-gray-500 text-xs font-medium">No messages yet</p>
                  <p className="text-gray-600 text-[11px] mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <div className="w-6 h-6 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center mr-2 shrink-0 self-end mb-1">
                          <FaUserCircle className="text-gray-500" size={14} />
                        </div>
                      )}
                      <div className={`max-w-[75%] sm:max-w-[65%] ${
                        isMe ? "items-end" : "items-start"
                      } flex flex-col gap-0.5`}>
                        <div className={`rounded-2xl px-3 py-2 ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-gray-800 text-gray-100 border border-white/5 rounded-bl-sm"
                        }`}>
                          <p className="text-xs sm:text-sm leading-relaxed">{msg.content}</p>
                        </div>
                        <p className="text-[10px] text-gray-600 px-1">
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
            <form onSubmit={handleSendMessage}
              className="px-3 sm:px-4 py-3 border-t border-white/5 bg-gray-900/40 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 min-w-0 bg-gray-800 border border-white/10 text-white text-xs sm:text-sm rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-blue-500/50 transition-all placeholder-gray-600"
                />
                <button type="submit" disabled={!message.trim()}
                  className="w-9 h-9 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all shrink-0 active:scale-95">
                  <FaPaperPlane size={12} />
                </button>
              </div>
            </form>
          </>
        ) : (
          /* No room selected — desktop empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 border border-white/5 flex items-center justify-center mb-4">
              <FaInbox className="text-gray-600" size={22} />
            </div>
            <p className="text-white text-sm font-semibold">Select a conversation</p>
            <p className="text-gray-500 text-xs mt-1 max-w-xs">
              Choose a chat from the sidebar to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;