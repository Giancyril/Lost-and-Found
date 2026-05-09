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
              const otherUser = room.participantUsers?.find((u: any) => u.id !== currentUser.id);
              const displayName = otherUser 
                ? (otherUser.role === "ADMIN" ? "Admin" : (otherUser.name || otherUser.username))
                : (room.claim?.foundItem?.foundItemName || "Lost Item");
              
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
                      {displayName}
                    </p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-tighter truncate">
                      {room.claim?.foundItem?.foundItemName || "General Chat"}
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
                  {(() => {
                    const otherUser = currentRoom?.participantUsers?.find((u: any) => u.id !== currentUser.id);
                    return otherUser 
                      ? (otherUser.role === "ADMIN" ? "Admin" : (otherUser.name || otherUser.username))
                      : "Direct Chat";
                  })()}
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

            {/* Admin Quick Replies */}
            {currentUser?.role === "ADMIN" && (
              <div className="px-3 sm:px-4 py-2 border-t border-white/5 bg-gray-950/20 overflow-x-auto flex items-center gap-2 custom-scrollbar whitespace-nowrap">
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mr-1">Quick Templates:</span>
                {[
                  { label: "Verify", text: "Hello! To verify ownership, could you please provide more details about this item (e.g., brand, specific marks, or content inside)?" },
                  { label: "Pickup Ready", text: "Good news! Your item is now ready for pickup at the SAS Office. Please bring your school ID for verification." },
                  { label: "Claim Approved", text: "Your ownership claim has been successfully verified and approved. You may now coordinate the pickup at your earliest convenience." },
                  { label: "Found Report", text: "Thank you for reporting this found item! It has been logged into the system. You can surrender it to the SAS Office." },
                ].map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => {
                      if (!activeRoomId || !socket) return;
                      socket.emit("send-message", { chatRoomId: activeRoomId, content: tpl.text });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500 hover:text-white transition-all whitespace-nowrap active:scale-95"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            )}

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
          /* No room selected — desktop empty state with role-based suggestions */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-950/40">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/5">
                  <FaInbox className="text-blue-400" size={28} />
                </div>
                <h2 className="text-white text-xl font-black tracking-tight">
                  {currentUser?.role === "ADMIN" ? "Admin Communication Hub" : "Student Support Center"}
                </h2>
                <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                  {currentUser?.role === "ADMIN" 
                    ? "Select a conversation from the sidebar to manage claims and coordinate pickups with students."
                    : "Select a conversation to chat with our staff about your claims or reported items."}
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {(currentUser?.role === "ADMIN" ? [
                  {
                    title: "Ownership Verification",
                    desc: "Ask for unique marks, brands, or specific contents to verify the claimant.",
                    tip: "Example: 'Could you describe any unique scratches or contents inside?'"
                  },
                  {
                    title: "Pickup Coordination",
                    desc: "Coordinate a safe time and location for the student to retrieve their item.",
                    tip: "Example: 'Your item is at the SAS Office. Bring your ID for verification.'"
                  },
                  {
                    title: "Found Item Follow-up",
                    desc: "Thank students for reporting found items and guide them to surrendering it.",
                    tip: "Example: 'Thank you for your report! Please surrender the item to SAS.'"
                  },
                  {
                    title: "Claim Resolution",
                    desc: "Notify users once their claim has been officially verified and closed.",
                    tip: "Example: 'Your claim for this item has been approved. Coordination complete.'"
                  }
                ] : [
                  {
                    title: "Inquire About Claims",
                    desc: "Ask for updates on your pending ownership claims or verification status.",
                    tip: "Example: 'Hi! I'd like to check the status of my claim for the blue wallet.'"
                  },
                  {
                    title: "Report Updates",
                    desc: "Provide additional details about an item you reported found or lost.",
                    tip: "Example: 'I found additional contents inside the bag I reported earlier.'"
                  },
                  {
                    title: "Pickup Inquiries",
                    desc: "Ask for office hours or specific instructions for picking up your item.",
                    tip: "Example: 'What time can I visit the SAS office to retrieve my ID?'"
                  },
                  {
                    title: "General Assistance",
                    desc: "Need help with the platform? Our staff is here to guide you.",
                    tip: "Example: 'I'm having trouble uploading images for my report. Can you help?'"
                  }
                ]).map((s, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-gray-900 border border-white/5 hover:border-blue-500/30 transition-all group">
                    <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">{s.title}</h3>
                    <p className="text-gray-300 text-[11px] leading-relaxed mb-3">{s.desc}</p>
                    <div className="p-2 rounded-lg bg-black/40 text-[10px] text-gray-500 italic border border-white/5 group-hover:text-gray-400 transition-colors">
                      {s.tip}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center justify-center gap-3">
                <div className="h-px w-8 bg-white/5" />
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Platform Guidelines</p>
                <div className="h-px w-8 bg-white/5" />
              </div>
              <p className="text-center text-gray-500 text-[10px] mt-3 leading-relaxed max-w-md mx-auto italic">
                {currentUser?.role === "ADMIN"
                  ? "Remember to maintain professional language and verify identity via Student ID before releasing any items."
                  : "Please be patient as our staff reviews your reports. Always provide accurate information for faster verification."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;