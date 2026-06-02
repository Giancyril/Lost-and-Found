import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { FaPaperPlane, FaUserCircle, FaInbox, FaCircle, FaArrowLeft, FaEllipsisV, FaEnvelopeOpen, FaTrash, FaReply, FaSmile } from "react-icons/fa";
import { useGetMyChatRoomsQuery, useGetChatMessagesQuery, useMarkAsReadMutation, useMarkAsUnreadMutation, useDeleteConversationMutation } from "../../redux/api/chatApi";
import { useSocket } from "../../hooks/useSocket";
import { getUserLocalStorage } from "../../auth/auth";
import { format } from "date-fns";
import { toast } from "react-toastify";

const ChatPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRoomId = searchParams.get("roomId");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(!activeRoomId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [skipAutoRead, setSkipAutoRead] = useState(false);
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
  const messageMenuRef = useRef<HTMLDivElement>(null);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);
  // Stores replyTo data keyed by message content so socket echo can merge it reliably
  const pendingReplyMap = useRef<Record<string, any>>({});

  const token = getUserLocalStorage();
  const { socket, isConnected } = useSocket({ autoConnect: true, token: token || "" });
  const { data: roomsData, isLoading: roomsLoading, refetch: refetchRooms } = useGetMyChatRoomsQuery(undefined);
  const { data: initialMessages, isLoading: messagesLoading } = useGetChatMessagesQuery(activeRoomId, {
    skip: !activeRoomId,
  });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAsUnread] = useMarkAsUnreadMutation();
  const [deleteConversation] = useDeleteConversationMutation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
      if (messageMenuRef.current && !messageMenuRef.current.contains(event.target as Node)) {
        setOpenMessageMenuId(null);
      }
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        setShowReactionPicker(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsUnread = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    try {
      if (roomId === activeRoomId) setSkipAutoRead(true);
      await markAsUnread(roomId).unwrap();
      await refetchRooms();
      toast.success("Marked as unread");
    } catch (error) {
      console.error('[Chat] Failed to mark as unread:', error);
      toast.error("Failed to mark as unread");
    }
  };

  const handleDeleteConversation = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (confirm("Delete this conversation? This cannot be undone.")) {
      try {
        await deleteConversation(roomId).unwrap();
        toast.success("Conversation deleted");
        if (roomId === activeRoomId) setSearchParams({});
      } catch (error) {
        toast.error("Failed to delete conversation");
      }
    }
  };

  const handleReactToMessage = (messageId: string, reaction: string) => {
    setOpenMessageMenuId(null);
    setShowReactionPicker(null);
    
    if (!socket || !activeRoomId) return;
    
    // Emit to socket
    socket.emit('add-reaction', { 
      messageId, 
      chatRoomId: activeRoomId, 
      emoji: reaction 
    });
    
    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const existing = (msg.reactions || []);
        const alreadyReacted = existing.some(
          (r: any) => r.emoji === reaction && r.userId === currentUser.id
        );
        const updated = alreadyReacted
          ? existing.filter((r: any) => !(r.emoji === reaction && r.userId === currentUser.id))
          : [...existing, { emoji: reaction, userId: currentUser.id }];
        return { ...msg, reactions: updated };
      })
    );
  };

  const handleShowReactionPicker = (messageId: string) => {
    setOpenMessageMenuId(null);
    setShowReactionPicker(messageId);
  };

  const handleReplyToMessage = (msg: any) => {
    setOpenMessageMenuId(null);
    setReplyToMessage(msg);
  };

  const handleDeleteMessage = (messageId: string) => {
    setOpenMessageMenuId(null);
    
    if (!socket || !activeRoomId) return;
    
    // Emit to socket
    socket.emit('delete-message', { 
      messageId, 
      chatRoomId: activeRoomId 
    });
    
    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isDeleted: true, content: "Message deleted" } : msg
      )
    );
    toast.success("Message deleted");
  };

  const rooms = roomsData?.data || [];
  const currentRoom = rooms.find((r: any) => r.id === activeRoomId);
  const currentUser = JSON.parse(atob(token?.split(".")[1] || "{}"));
  const unreadCount = rooms.filter((room: any) => {
    const lastMsg = room.messages?.[0];
    const lastReadAt = room.readStatuses?.[0]?.lastReadAt;
    return lastMsg && (!lastReadAt || new Date(lastMsg.createdAt) > new Date(lastReadAt));
  }).length;

  useEffect(() => {
    if (activeRoomId && !skipAutoRead) {
      markAsRead(activeRoomId).catch((err) => {
        if (err?.status !== 403) console.error('[Chat] Failed to auto-mark as read:', err);
      });
    }
    if (skipAutoRead) {
      const timer = setTimeout(() => setSkipAutoRead(false), 100);
      return () => clearTimeout(timer);
    }
  }, [activeRoomId, markAsRead, skipAutoRead]);

  useEffect(() => {
    if (!socket) return;
    socket.on("chat-user-typing", (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== currentUser.id) setIsOtherUserTyping(data.isTyping);
    });
    return () => { socket.off("chat-user-typing"); };
  }, [socket, currentUser.id]);

  useEffect(() => {
    if (!socket) return;
    socket.on("message-received", (newMessage: any) => {
      if (newMessage.chatRoomId === activeRoomId) {
        setMessages((prev) => {
          // Transform DB replyTo format to frontend format
          let transformedReplyTo = null;
          if (newMessage.replyTo) {
            const replySender = newMessage.replyTo.sender;
            const senderName = replySender
              ? (replySender.role === "ADMIN" ? "Admin" : (replySender.name || replySender.username))
              : "User";
            transformedReplyTo = {
              id: newMessage.replyTo.id,
              content: newMessage.replyTo.content,
              senderId: newMessage.replyTo.senderId,
              senderName,
            };
          }

          // Replace the optimistic temp message
          const tempIdx = prev.findIndex(
            (m) => m.id?.startsWith("temp-") && m.senderId === newMessage.senderId && m.content === newMessage.content
          );

          const finalMessage = {
            ...newMessage,
            replyTo: transformedReplyTo || (tempIdx !== -1 ? prev[tempIdx].replyTo : null),
          };

          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = finalMessage;
            return updated;
          }

          // Other user's message
          return [...prev, finalMessage];
        });
        markAsRead(activeRoomId).catch((err) => {
          if (err?.status !== 403) console.error('[Chat] Failed to mark as read on new message:', err);
        });
      }
    });

    socket.on('message-deleted', (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, isDeleted: true, content: "Message deleted" } : msg
        )
      );
    });

    socket.on('reaction-updated', (data: { messageId: string, reactions: any[] }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    });

    return () => { 
      socket.off("message-received");
      socket.off("message-deleted");
      socket.off("reaction-updated");
    };
  }, [socket, activeRoomId, markAsRead]);

  useEffect(() => {
    if (socket && activeRoomId && isConnected) socket.emit("join-chat", activeRoomId);
    return () => { if (socket && activeRoomId) socket.emit("leave-chat", activeRoomId); };
  }, [socket, activeRoomId, isConnected]);

  useEffect(() => {
    if (activeRoomId) {
      if (initialMessages?.data) {
        // Transform replyTo format for all messages
        const transformedMessages = initialMessages.data.map((msg: any) => {
          if (msg.replyTo) {
            const replySender = msg.replyTo.sender;
            const senderName = replySender
              ? (replySender.role === "ADMIN" ? "Admin" : (replySender.name || replySender.username))
              : "User";
            return {
              ...msg,
              replyTo: {
                id: msg.replyTo.id,
                content: msg.replyTo.content,
                senderId: msg.replyTo.senderId,
                senderName,
              },
            };
          }
          return msg;
        });
        setMessages(transformedMessages);
      } else if (messagesLoading) {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [activeRoomId, initialMessages, messagesLoading]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectRoom = (roomId: string) => {
    setSearchParams({ roomId });
    setShowSidebar(false);
  };

  const handleBack = () => { setShowSidebar(true); };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeRoomId || !socket) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("chat-typing-stop", { chatRoomId: activeRoomId });

    const messageData: any = { chatRoomId: activeRoomId, content: message };

    // Build replyTo data properly
    let replyToData = null;
    if (replyToMessage) {
      const replySender = currentRoom?.participantUsers?.find((u: any) => u.id === replyToMessage.senderId);
      const senderName = replySender
        ? (replySender.role === "ADMIN" ? "Admin" : (replySender.name || replySender.username))
        : (replyToMessage.senderId === currentUser.id ? (currentUser.name || currentUser.username || "You") : "User");

      replyToData = {
        id: replyToMessage.id,
        content: replyToMessage.content,
        senderId: replyToMessage.senderId,
        senderName,
      };
      messageData.replyTo = replyToData;
    }

    socket.emit("send-message", messageData);

    // Optimistic message with replyTo
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      chatRoomId: activeRoomId,
      senderId: currentUser.id,
      content: message,
      createdAt: new Date().toISOString(),
      replyTo: replyToData,
      reactions: [],
      isDeleted: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    setMessage("");
    setReplyToMessage(null);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (!socket || !activeRoomId) return;
    socket.emit("chat-typing-start", { chatRoomId: activeRoomId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat-typing-stop", { chatRoomId: activeRoomId });
    }, 2000);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] bg-gray-900 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">

      {/* ── Sidebar ── */}
      <div className={`
        ${showSidebar ? "flex" : "hidden"} sm:flex
        w-full sm:w-72 lg:w-80
        border-r border-white/5 flex-col bg-gray-900/50 shrink-0
      `}>
        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2.5">
          <FaInbox className="text-blue-400" size={13} />
          <h2 className="text-white font-bold text-sm">Messages</h2>
          {unreadCount > 0 && (
            <span className="ml-auto text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

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
              const lastMsg = room.messages?.[0];
              const otherUser = room.participantUsers?.find((u: any) => u.id !== currentUser.id);
              const displayName = otherUser
                ? (otherUser.role === "ADMIN" ? "Admin" : (otherUser.name || otherUser.username))
                : (room.claim?.foundItem?.foundItemName || "Lost Item");
              const lastReadAt = room.readStatuses?.[0]?.lastReadAt;
              const hasUnread = lastMsg && (!lastReadAt || new Date(lastMsg.createdAt) > new Date(lastReadAt));

              return (
                <div key={room.id} className="relative">
                  <div
                    onClick={() => handleSelectRoom(room.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 cursor-pointer ${isActive
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === room.id ? null : room.id);
                      }}
                      className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0"
                    >
                      <FaEllipsisV size={12} />
                    </button>
                  </div>

                  {openMenuId === room.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-2 top-full mt-1 w-48 bg-gray-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn"
                    >
                      {!hasUnread ? (
                        <button
                          onClick={(e) => handleMarkAsUnread(room.id, e)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <FaEnvelopeOpen size={12} className="text-blue-400" />
                          <span>Mark as unread</span>
                        </button>
                      ) : (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            try {
                              await markAsRead(room.id).unwrap();
                              toast.success("Marked as read");
                              refetchRooms();
                            } catch {
                              toast.error("Failed to mark as read");
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <FaEnvelopeOpen size={12} className="text-green-400" />
                          <span>Mark as read</span>
                        </button>
                      )}
                      <div className="h-px bg-white/5" />
                      <button
                        onClick={(e) => handleDeleteConversation(room.id, e)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <FaTrash size={12} />
                        <span>Delete conversation</span>
                      </button>
                    </div>
                  )}
                </div>
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

            {/* Sticky Claim Header */}
            {currentRoom?.claim?.foundItem && (
              <div className="px-4 py-2 bg-gray-900/60 border-b border-white/5 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={currentRoom?.claim?.foundItem?.images?.[0] || currentRoom?.claim?.foundItem?.img || "/bgimg.png"}
                    alt={currentRoom?.claim?.foundItem?.foundItemName}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                    className="w-10 h-10 rounded-lg object-cover border border-white/5 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-white text-xs font-bold truncate">{currentRoom?.claim?.foundItem?.foundItemName}</p>
                    <p className="text-gray-500 text-[10px] truncate mt-0.5">📍 {currentRoom?.claim?.foundItem?.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${
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
                  const isDeleted = msg.isDeleted || false;
                  const reactions = msg.reactions || [];

                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-1.5 group`}>

                      {/* Avatar — other user only */}
                      {!isMe && (
                        <div className="w-6 h-6 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center shrink-0 mb-5">
                          <FaUserCircle className="text-gray-500" size={14} />
                        </div>
                      )}

                      {/* FIX: Bubble + meta wrapper, flex-col so reply preview stacks above bubble */}
                      <div className={`flex flex-col gap-0.5 relative ${isMe ? "items-end" : "items-start"} max-w-[72%] sm:max-w-[60%]`}>

                        {/* Reply preview — shown above the bubble */}
                        {msg.replyTo && (
                          <div className={`px-2.5 py-1.5 rounded-lg border-l-3 mb-1 ${
                            isMe ? "border-blue-400 bg-blue-500/10" : "border-gray-500 bg-gray-700/40"
                          } text-[10px] max-w-full backdrop-blur-sm`}>
                            <p className={`font-bold mb-0.5 ${isMe ? "text-blue-300" : "text-gray-300"}`}>
                              {msg.replyTo.senderName || "User"}
                            </p>
                            <p className={`truncate ${isMe ? "text-blue-200/70" : "text-gray-400"}`}>
                              {msg.replyTo.content}
                            </p>
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`rounded-2xl px-3 py-2 ${
                          isDeleted
                            ? "bg-gray-900/50 text-gray-500 italic border border-white/5"
                            : isMe
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-gray-800 text-gray-100 border border-white/5 rounded-bl-sm"
                        }`}>
                          <p className="text-xs sm:text-sm leading-relaxed break-words">{msg.content}</p>
                        </div>

                        {/* Reactions */}
                        {reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {Object.entries(
                              reactions.reduce((acc: any, r: any) => {
                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                return acc;
                              }, {})
                            ).map(([emoji, count]) => (
                              <div
                                key={emoji}
                                className="flex items-center gap-0.5 bg-gray-800/80 border border-white/10 rounded-full px-1.5 py-0.5 text-xs"
                              >
                                <span className="text-xs">{emoji}</span>
                                {(count as number) > 1 && (
                                  <span className="text-[9px] text-gray-400 font-medium">{count as number}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-[10px] text-gray-600 px-0.5">
                          {format(new Date(msg.createdAt), "p")}
                        </p>

                        {/* FIX: Message menu dropdown — positioned relative to bubble */}
                        {openMessageMenuId === msg.id && !isDeleted && (
                          <div
                            ref={messageMenuRef}
                            className={`absolute ${isMe ? "right-0" : "left-0"} bottom-full mb-1 w-32 bg-gray-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn`}
                          >
                            <button
                              onClick={() => handleShowReactionPicker(msg.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              <FaSmile size={10} className="text-yellow-400" />
                              <span>React</span>
                            </button>
                            <button
                              onClick={() => handleReplyToMessage(msg)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              <FaReply size={10} className="text-blue-400" />
                              <span>Reply</span>
                            </button>
                            {isMe && (
                              <>
                                <div className="h-px bg-white/5" />
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <FaTrash size={10} />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Reaction picker — responsive sizing */}
                        {showReactionPicker === msg.id && (
                          <div
                            ref={reactionPickerRef}
                            className={`absolute ${isMe ? "right-0" : "left-0"} bottom-full mb-1 bg-gray-800 border border-white/10 rounded-2xl shadow-2xl p-1.5 sm:p-2 z-[60] animate-fadeIn`}
                          >
                            <div className="flex gap-0.5 sm:gap-1">
                              {["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥"].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReactToMessage(msg.id, emoji)}
                                  className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-lg hover:bg-white/10 rounded-lg transition-all active:scale-90 hover:scale-110"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* FIX: Three-dot button — always right next to the bubble, same row */}
                      {!isDeleted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMessageMenuId(openMessageMenuId === msg.id ? null : msg.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center transition-all shrink-0 text-gray-500 hover:text-white mb-5"
                        >
                          <FaEllipsisV size={10} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}

              {isOtherUserTyping && (
                <div className="flex justify-start items-end gap-2 mt-2 animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center shrink-0">
                    <FaUserCircle className="text-gray-500" size={14} />
                  </div>
                  <div className="bg-gray-800 text-gray-400 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Meetup Templates */}
            <div className="px-3 sm:px-4 py-2 border-t border-white/5 bg-gray-950/20 overflow-x-auto flex items-center gap-2 custom-scrollbar whitespace-nowrap">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-1 shrink-0">Meetup Templates:</span>
              {[
                { label: " SAS Office Lobby", text: "Hi! Can we meet at the SAS Office Lobby to coordinate the handoff?" },
                { label: " Library Lobby", text: "Hello! I am near the Campus Library Lobby. Can we meet there to return the item?" },
                { label: " Student Canteen", text: "Hey! Let's meet up at the Student Canteen for the item exchange." },
                { label: " Meet Tomorrow", text: "Hi! Are you free to meet tomorrow at 10:00 AM at the SAS Office?" },
              ].map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => {
                    if (!activeRoomId || !socket) return;
                    socket.emit("send-message", { chatRoomId: activeRoomId, content: tpl.text });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-[10px] font-semibold transition-all whitespace-nowrap active:scale-95"
                >
                  {tpl.label}
                </button>
              ))}

              {currentUser?.role === "ADMIN" && (
                <>
                  <div className="h-4 w-px bg-white/10 mx-1 shrink-0" />
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mr-1 shrink-0">Admin:</span>
                  {[
                    { label: "Verify", text: "Hello! To verify ownership, could you please provide more details about this item (e.g., brand, specific marks, or content inside)?" },
                    { label: "Pickup Ready", text: "Good news! Your item is now ready for pickup at the SAS Office. Please bring your school ID for verification." },
                    { label: "Claim Approved", text: "Your ownership claim has been successfully verified and approved. You may now coordinate the pickup at your earliest convenience." },
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
                </>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage}
              className="px-3 sm:px-4 py-3 border-t border-white/5 bg-gray-900/40 shrink-0">
              {/* Reply Preview */}
              {replyToMessage && (
                <div className="mb-2 px-3 py-2 bg-gray-800/80 border-l-3 border-blue-500 rounded-lg flex items-start justify-between gap-2 backdrop-blur-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-blue-400 font-bold mb-1 flex items-center gap-1">
                      <FaReply size={8} />
                      Replying to {
                        replyToMessage.senderId === currentUser.id
                          ? "yourself"
                          : (() => {
                              const sender = currentRoom?.participantUsers?.find((u: any) => u.id === replyToMessage.senderId);
                              return sender ? (sender.role === "ADMIN" ? "Admin" : (sender.name || sender.username)) : "User";
                            })()
                      }
                    </p>
                    <p className="text-xs text-gray-300 truncate">{replyToMessage.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyToMessage(null)}
                    className="text-gray-500 hover:text-white text-xl leading-none shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                    title="Cancel reply"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={handleMessageChange}
                  placeholder={replyToMessage ? "Type your reply..." : "Type a message..."}
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
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-950/40 overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl w-full flex flex-col items-center">
              <div className="text-center mb-10">
                <h2 className="text-white text-xl font-black tracking-tight">
                  {currentUser?.role === "ADMIN" ? "Admin Communication Hub" : "Student Support Center"}
                </h2>
                <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                  {currentUser?.role === "ADMIN"
                    ? "Select a conversation from the sidebar to manage claims and coordinate pickups with students."
                    : "Select a conversation to chat with our staff about your claims or reported items."}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {(currentUser?.role === "ADMIN" ? [
                  { title: "Ownership Verification", desc: "Ask for unique marks, brands, or specific contents to verify the claimant.", tip: "Example: 'Could you describe any unique scratches or contents inside?'" },
                  { title: "Pickup Coordination", desc: "Coordinate a safe time and location for the student to retrieve their item.", tip: "Example: 'Your item is at the SAS Office. Bring your ID for verification.'" },
                  { title: "Found Item Follow-up", desc: "Thank students for reporting found items and guide them to surrendering it.", tip: "Example: 'Thank you for your report! Please surrender the item to SAS.'" },
                  { title: "Claim Resolution", desc: "Notify users once their claim has been officially verified and closed.", tip: "Example: 'Your claim for this item has been approved. Coordination complete.'" },
                ] : [
                  { title: "Inquire About Claims", desc: "Ask for updates on your pending ownership claims or verification status.", tip: "Example: 'Hi! I'd like to check the status of my claim for the blue wallet.'" },
                  { title: "Report Updates", desc: "Provide additional details about an item you reported found or lost.", tip: "Example: 'I found additional contents inside the bag I reported earlier.'" },
                  { title: "Pickup Inquiries", desc: "Ask for office hours or specific instructions for picking up your item.", tip: "Example: 'What time can I visit the SAS office to retrieve my ID?'" },
                  { title: "General Assistance", desc: "Need help with the platform? Our staff is here to guide you.", tip: "Example: 'I'm having trouble uploading images for my report. Can you help?'" },
                ]).map((s, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-gray-900/60 border border-white/5 hover:border-blue-500/30 transition-all group flex flex-col h-full">
                    <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">{s.title}</h3>
                    <p className="text-gray-300 text-[11px] leading-relaxed mb-3 flex-1">{s.desc}</p>
                    <div className="p-2 rounded-lg bg-black/40 text-[10px] text-gray-500 italic border border-white/5 group-hover:text-gray-400 transition-colors">
                      {s.tip}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;