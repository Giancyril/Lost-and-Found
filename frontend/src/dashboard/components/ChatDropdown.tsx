import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaPaperPlane, FaUserCircle, FaInbox, FaArrowLeft, FaComments, FaTimes } from "react-icons/fa";
import { useGetMyChatRoomsQuery, useGetChatMessagesQuery, useMarkAsReadMutation } from "../../redux/api/chatApi";
import { useSocket } from "../../hooks/useSocket";
import { getUserLocalStorage, useUserVerification } from "../../auth/auth";
import { format } from "date-fns";

const ChatDropdown = () => {
  const [open, setOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  const token = getUserLocalStorage();
  const currentUser = useUserVerification() as any;
  const { socket, isConnected } = useSocket({ autoConnect: true, token: token || "" });
  const { data: roomsData, isLoading: roomsLoading } = useGetMyChatRoomsQuery(undefined);
  const { data: initialMessages, isLoading: messagesLoading } = useGetChatMessagesQuery(activeRoomId, {
    skip: !activeRoomId,
  });
  const [markAsRead] = useMarkAsReadMutation();



  const rooms = roomsData?.data || [];
  const currentRoom = rooms.find((r: any) => r.id === activeRoomId);

  const unreadCount = rooms.filter((room: any) => {
    const lastMsg = room.messages?.[0];
    const lastReadAt = room.readStatuses?.[0]?.lastReadAt;
    return lastMsg && (!lastReadAt || new Date(lastMsg.createdAt) > new Date(lastReadAt)) && lastMsg.senderId !== currentUser?.id;
  }).length;

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      setActiveRoomId(null);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (activeRoomId && open) {
      markAsRead(activeRoomId);
    }
  }, [activeRoomId, markAsRead, open]);

  useEffect(() => {
    if (!socket) return;
    socket.on("chat-user-typing", (data: { userId: string; isTyping: boolean }) => {
      console.warn("[WS Client] Received chat-user-typing:", data);
      if (data.userId !== currentUser?.id) {
        setIsOtherUserTyping(data.isTyping);
      }
    });
    return () => {
      socket.off("chat-user-typing");
    };
  }, [socket, currentUser?.id]);

  useEffect(() => {
    if (!socket) return;
    socket.on("message-received", (newMessage: any) => {
      if (newMessage.chatRoomId === activeRoomId) {
        setMessages((prev) => [...prev, newMessage]);
        if (open) markAsRead(activeRoomId);
      }
    });
    return () => { socket.off("message-received"); };
  }, [socket, activeRoomId, markAsRead, open]);

  useEffect(() => {
    if (socket && activeRoomId && isConnected) {
      socket.emit("join-chat", activeRoomId);
    }
    return () => {
      if (socket && activeRoomId) socket.emit("leave-chat", activeRoomId);
    };
  }, [socket, activeRoomId, isConnected]);

  // Synchronize messages with initial query data and handle room changes safely without race conditions
  useEffect(() => {
    if (activeRoomId) {
      if (initialMessages?.data) {
        setMessages(initialMessages.data);
      } else if (messagesLoading) {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [activeRoomId, initialMessages, messagesLoading]);

  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, activeRoomId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeRoomId || !socket) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("chat-typing-stop", { chatRoomId: activeRoomId });

    socket.emit("send-message", { chatRoomId: activeRoomId, content: message });
    setMessage("");
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!socket || !activeRoomId) return;

    console.warn("[WS Client] Emitting chat-typing-start for room:", activeRoomId);
    socket.emit("chat-typing-start", { chatRoomId: activeRoomId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      console.warn("[WS Client] Emitting chat-typing-stop for room:", activeRoomId);
      socket.emit("chat-typing-stop", { chatRoomId: activeRoomId });
    }, 2000);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-all border ${open
            ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
            : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
          }`}
      >
        <FaComments size={14} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-gray-900">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden" onClick={() => setOpen(false)} />

          <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[68px] sm:top-11 w-auto sm:w-[380px] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col h-[500px] max-h-[80vh]">
            <div className="px-4 py-3 border-b border-white/5 bg-gray-800/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {activeRoomId && (
                  <button onClick={() => setActiveRoomId(null)} className="text-gray-400 hover:text-white mr-1">
                    <FaArrowLeft size={12} />
                  </button>
                )}
                <h2 className="text-white font-bold text-sm">
                  {activeRoomId
                    ? (currentRoom?.participantUsers?.find((u: any) => u.id !== currentUser?.id)?.role === "ADMIN" ? "Staff Chat" : "Messaging")
                    : "Conversations"}
                </h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
                <FaTimes size={12} />
              </button>
            </div>

            {/* Sticky Claim Header */}
            {activeRoomId && currentRoom?.claim?.foundItem && (
              <div className="px-3.5 py-1.5 bg-gray-900/60 border-b border-white/5 flex items-center justify-between gap-2.5 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={currentRoom?.claim?.foundItem?.images?.[0] || currentRoom?.claim?.foundItem?.img || "/bgimg.png"}
                    alt={currentRoom?.claim?.foundItem?.foundItemName}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                    className="w-7 h-7 rounded-md object-cover border border-white/5 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-white text-[11px] font-bold truncate">{currentRoom?.claim?.foundItem?.foundItemName}</p>
                    <p className="text-gray-550 text-[9px] truncate"> {currentRoom?.claim?.foundItem?.location}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full border ${
                    currentRoom?.claim?.foundItem?.isClaimed || currentRoom?.claim?.status === "APPROVED"
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : currentRoom?.claim?.status === "REJECTED"
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                    }`}>
                    {currentRoom?.claim?.foundItem?.isClaimed || currentRoom?.claim?.status === "APPROVED"
                      ? "CLAIMED"
                      : currentRoom?.claim?.status || "PENDING"}
                  </span>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col">
              {!activeRoomId ? (
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {roomsLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
                    </div>
                  ) : rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <FaInbox className="text-gray-700 mb-2" size={24} />
                      <p className="text-gray-500 text-xs">No conversations yet</p>
                    </div>
                  ) : (
                    rooms.map((room: any) => {
                      const lastMsg = room.messages?.[0];
                      const otherUser = room.participantUsers?.find((u: any) => u.id !== currentUser?.id);
                      const displayName = otherUser
                        ? (otherUser.role === "ADMIN" ? "Admin" : (otherUser.name || otherUser.username))
                        : (room.claim?.foundItem?.foundItemName || "Lost Item");

                      const lastReadAt = room.readStatuses?.[0]?.lastReadAt;
                      const hasUnread = lastMsg && (!lastReadAt || new Date(lastMsg.createdAt) > new Date(lastReadAt)) && lastMsg.senderId !== currentUser?.id;

                      return (
                        <button key={room.id} onClick={() => setActiveRoomId(room.id)}
                          className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-all flex items-center gap-3 border border-transparent hover:border-white/5">
                          <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center shrink-0 relative">
                            <FaUserCircle className="text-gray-500" size={20} />
                            {hasUnread && <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border border-gray-900" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${hasUnread ? "text-white" : "text-gray-300"}`}>{displayName}</p>
                            <p className={`text-[10px] truncate mt-0.5 ${hasUnread ? "text-blue-400 font-medium" : "text-gray-500"}`}>
                              {lastMsg?.content || "No messages yet"}
                            </p>
                          </div>
                          {hasUnread && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <div ref={messageContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                    {messagesLoading ? (
                      <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = msg.senderId === currentUser?.id;
                        return (
                          <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                              <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-800 text-gray-100 border border-white/5 rounded-bl-sm"
                                }`}>
                                {msg.content}
                              </div>
                              <p className="text-[9px] text-gray-600 px-1">{format(new Date(msg.createdAt), "p")}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {isOtherUserTyping && (
                    <div className="px-4 py-2 flex justify-start items-center gap-2 shrink-0 bg-gray-900/40 border-t border-white/5">
                      <div className="w-5 h-5 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center shrink-0">
                        <FaUserCircle className="text-gray-500" size={12} />
                      </div>
                      <div className="flex items-center gap-1 bg-gray-800 border border-white/5 px-2.5 py-1.5 rounded-xl rounded-bl-sm">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}

                  {/* Coordination & Admin Templates */}
                  <div className="px-3 py-1.5 border-t border-white/5 bg-black/20 overflow-x-auto flex items-center gap-1.5 custom-scrollbar whitespace-nowrap shrink-0">
                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider shrink-0">Meetup:</span>
                    {[
                      { label: " SAS Lobby", text: "Can we meet at the SAS Office Lobby to coordinate the handoff?" },
                      { label: " Library Lobby", text: "I am near the Campus Library Lobby. Can we meet there?" },
                    ].map((tpl) => (
                      <button key={tpl.label} onClick={() => socket?.emit("send-message", { chatRoomId: activeRoomId, content: tpl.text })}
                        className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-[8px] font-semibold transition-all whitespace-nowrap">
                        {tpl.label}
                      </button>
                    ))}

                    {currentUser?.role === "ADMIN" && (
                      <>
                        <div className="h-3 w-px bg-white/10 mx-0.5 shrink-0" />
                        <span className="text-[8px] text-blue-400 font-bold uppercase tracking-wider shrink-0">Admin:</span>
                        {[
                          { label: "Verify", text: "Hello! To verify ownership, could you please provide more details about this item?" },
                          { label: "Ready", text: "Good news! Your item is now ready for pickup at the SAS Office. Please bring your school ID." },
                        ].map((tpl) => (
                          <button key={tpl.label} onClick={() => socket?.emit("send-message", { chatRoomId: activeRoomId, content: tpl.text })}
                            className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-bold hover:bg-blue-500 hover:text-white transition-all">
                            {tpl.label}
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-gray-900/40">
                    <div className="flex items-center gap-2">
                      <input type="text" value={message} onChange={handleMessageChange} placeholder="Type a message..."
                        className="flex-1 bg-gray-800 border border-white/10 text-white text-[11px] rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500/50" />
                      <button type="submit" disabled={!message.trim()}
                        className="w-8 h-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-all">
                        <FaPaperPlane size={11} />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-white/5 bg-gray-900 flex justify-center">
              <button
                onClick={() => {
                  setOpen(false);
                  const chatPath = currentUser?.role === "ADMIN" ? "/dashboard/chat" : "/dashboard/student/chat";
                  navigate(activeRoomId ? `${chatPath}?roomId=${activeRoomId}` : chatPath);
                }}
                className="text-blue-400 hover:text-blue-300 text-[10px] font-bold uppercase tracking-widest"
              >
                Open Full Messenger
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatDropdown;
