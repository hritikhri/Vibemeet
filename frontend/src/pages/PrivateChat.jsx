// src/pages/PrivateChat.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";

import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
import BottomNav from "../components/layout/BottomNav";

export default function PrivateChat() {
  const { socket, user } = useAuthStore();
  const { otherUserId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null); // store actual File for upload
  const [sending, setSending] = useState(false);

  // ── Load history + other-user profile ──────────────────────────────────────
  const loadChat = useCallback(async () => {
    if (!otherUserId) return;
    setLoading(true);
    try {
      const [chatRes, userRes] = await Promise.all([
        api.get(`/chats/private/${otherUserId}`),
        api.get(`/users/${otherUserId}`),
      ]);
      setMessages(chatRes.data.messages || []);
      setOtherUser(userRes.data);
      console.log(chatRes.data)
    } catch (err) {
      console.error("Failed to load chat:", err);
    } finally {
      setLoading(false);
    }
  }, [otherUserId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // ── Socket listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !otherUserId) return;

    socket.emit("joinPrivateChat", otherUserId);

    // Ask for initial online status
    socket.emit("getOnlineStatus", otherUserId);

    const onNewMessage = (msg) => {
      if (
        msg.from === otherUserId ||
        msg.to === otherUserId ||
        msg.from === user?._id
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // Mark message as read if it's from the other user and chat is open
        if (msg.from === otherUserId && socket) {
          socket.emit("markMessageAsRead", { messageId: msg._id });
        }
      }
    };

    const onMessageRead = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status: "read" } : m))
      );
    };

    const onMessageDelivered = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, status: "delivered" } : m
        )
      );
    };

    const onConversationRead = ({ byUserId }) => {
      if (byUserId === otherUserId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.from === user?._id ? { ...m, status: "read" } : m
          )
        );
      }
    };

    const onTyping = ({ fromUserId, isTyping: typing }) => {
      if (fromUserId === otherUserId) setIsTyping(typing);
    };

    // Backend emits "isOnline" field for getOnlineStatus response
    const onOnlineStatus = ({ userId, online: isOnline, isOnline: altOnline }) => {
      if (userId === otherUserId) setOnline(isOnline ?? altOnline ?? false);
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, deleted: true, text: "" } : m
        )
      );
    };

    socket.on("newPrivateMessage", onNewMessage);
    socket.on("messageRead", onMessageRead);
    socket.on("messageDelivered", onMessageDelivered);
    socket.on("conversationRead", onConversationRead);
    socket.on("typing", onTyping);
    socket.on("userOnlineStatus", onOnlineStatus);
    socket.on("messageDeleted", onMessageDeleted);

    // Mark conversation as read on open
    socket.emit("markConversationRead", { fromUserId: otherUserId });

    return () => {
      socket.off("newPrivateMessage", onNewMessage);
      socket.off("messageRead", onMessageRead);
      socket.off("messageDelivered", onMessageDelivered);
      socket.off("conversationRead", onConversationRead);
      socket.off("typing", onTyping);
      socket.off("userOnlineStatus", onOnlineStatus);
      socket.off("messageDeleted", onMessageDeleted);
    };
  }, [socket, otherUserId, user?._id]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if ((!newMessage.trim() && !imagePreview) || sending) return;
    if (!socket) return;

    setSending(true);

    try {
      // If there's an image file, upload it via HTTP then emit via socket
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        if (newMessage.trim()) formData.append("text", newMessage.trim());
        if (replyTo?._id) formData.append("replyTo", replyTo._id);

        await api.post(`/chats/private/${otherUserId}/image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // The image message will arrive via socket event (emitted by server)
        setNewMessage("");
        setImagePreview(null);
        setImageFile(null);
        setReplyTo(null);
        return;
      }

      // Text-only message via socket
      const messageData = {
        toUserId: otherUserId,
        text: newMessage.trim(),
        replyTo: replyTo?._id ?? null,
      };

      socket.emit("sendPrivateMessage", messageData, (response) => {
        if (response?.success) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === response.message._id)) return prev;
            return [...prev, response.message];
          });
        }
      });

      setNewMessage("");
      setReplyTo(null);
    } finally {
      setSending(false);
    }
  };

  // ── Delete message ──────────────────────────────────────────────────────────
  const deleteMessage = useCallback(
    (messageId) => {
      if (!socket) return;
      socket.emit("deletePrivateMessage", { messageId }, (res) => {
        if (res?.success) {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === messageId ? { ...m, deleted: true, text: "" } : m
            )
          );
        }
      });
    },
    [socket]
  );

  // ── Typing indicator emit ───────────────────────────────────────────────────
  const handleTyping = (value) => {
    setNewMessage(value);
    if (!socket) return;
    socket.emit("typing", { toUserId: otherUserId, isTyping: value.length > 0 });
  };

  const handleImageSelect = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ChatHeader
        otherUser={otherUser}
        isTyping={isTyping}
        online={online}
        onBack={() => navigate("/chat")}
      />

      <MessageList
        messages={messages}
        currentUserId={user?._id}
        otherUser={otherUser}
        isTyping={isTyping}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        loading={loading}
        onDeleteMessage={deleteMessage}
      />

      <ChatInput
        newMessage={newMessage}
        setNewMessage={handleTyping}
        imagePreview={imagePreview}
        setImagePreview={(v) => {
          setImagePreview(v);
          if (!v) setImageFile(null);
        }}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={sendMessage}
        onImageSelect={handleImageSelect}
        sending={sending}
      />

      <BottomNav />
    </div>
  );
}