import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabase";
import { 
  FaTimes, 
  FaPaperPlane, 
  FaImage, 
  FaSpinner, 
  FaSmile, 
  FaArrowDown, 
  FaCheck,
  FaDownload,
  FaSearchPlus
} from "react-icons/fa";

const emojiOptions = ["👍", "😂", "😮", "😢", "❤️"];

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const ChatBox = ({ ticketId, currentUser, assignedUserId, ticketCreatorId, onChatClosed }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [otherPartyInfo, setOtherPartyInfo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Cloudinary credentials
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  // Determine perspective:
  // If currentUser.id === assignedUserId then current user is employee so other party is ticket creator;
  // otherwise, other party is assigned employee.
  const otherPartyId = currentUser.id === assignedUserId ? ticketCreatorId : assignedUserId;

  // Fetch other party info from users table
  useEffect(() => {
    const fetchOtherPartyInfo = async () => {
      if (!otherPartyId) return;
      const { data, error } = await supabase
        .from("users")
        .select("id, name, role, profile_picture")
        .eq("id", otherPartyId)
        .single();
      if (error) {
        console.error("Error fetching other party info:", error);
      } else {
        setOtherPartyInfo(data);
      }
    };
    fetchOtherPartyInfo();
  }, [otherPartyId]);

  // --- TYPING INDICATORS ---
  const typingChannel = useRef(null);
  useEffect(() => {
    typingChannel.current = supabase.channel(`typing:${ticketId}`);
    typingChannel.current.on("broadcast", { event: "typing" }, (payload) => {
      const { userId, isTyping } = payload.payload;
      if (userId === currentUser.id) return;
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(userId) ? prev : [...prev, userId];
        } else {
          return prev.filter((id) => id !== userId);
        }
      });
    }).subscribe();
    return () => {
      supabase.removeChannel(typingChannel.current);
    };
  }, [ticketId, currentUser.id]);

  const handleTyping = () => {
    typingChannel.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUser.id, isTyping: true },
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingChannel.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUser.id, isTyping: false },
      });
    }, 3000);
  };

  // Helper: Upload image to Cloudinary
  async function uploadToCloudinary(file) {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) return data.secure_url;
      throw new Error("Cloudinary upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  // Fetch messages and subscribe to realtime updates
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data);
      }
    };
    fetchMessages();
    const channel = supabase
      .channel("realtime:messages")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `ticket_id=eq.${ticketId}`,
      }, (payload) => {
        setMessages((current) => [...current, payload.new]);
      }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  // Auto-scroll to bottom on messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Show "scroll down" arrow when not at bottom
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 20;
    setShowScrollDown(!isAtBottom);
  };

  // Read receipts: mark messages as read for messages not from current user
  useEffect(() => {
    const markMessagesAsRead = async () => {
      const unreadMessages = messages.filter(
        (msg) => msg.sender_id !== currentUser.id && !msg.read_at
      );
      if (unreadMessages.length > 0) {
        for (const msg of unreadMessages) {
          await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("id", msg.id);
        }
        setMessages((msgs) =>
          msgs.map((msg) =>
            msg.sender_id !== currentUser.id && !msg.read_at
              ? { ...msg, read_at: new Date().toISOString() }
              : msg
          )
        );
      }
    };
    markMessagesAsRead();
  }, [messages, currentUser.id]);

  // Send new message (with optional image)
  const handleSend = async () => {
    if (!currentUser || !currentUser.id) {
      console.error("Current user is undefined. Cannot send message.");
      return;
    }
    let imageUrl = null;
    if (selectedFile) {
      try {
        imageUrl = await uploadToCloudinary(selectedFile);
      } catch (err) {
        console.error("Image upload failed:", err);
        return;
      }
    }
    const { error } = await supabase.from("messages").insert([
      {
        ticket_id: ticketId,
        sender_id: currentUser.id,
        content: newMessage || "",
        image_url: imageUrl || null,
      },
    ]);
    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
      setSelectedFile(null);
      typingChannel.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUser.id, isTyping: false },
      });
    }
  };

  // Reaction handling: toggles the reaction picker when clicked
  const handleReactionToggle = (msgId) => {
    setReactionPickerMessageId(prev => (prev === msgId ? null : msgId));
  };

  const handleReactionSelect = async (msgId, emoji) => {
    const { error } = await supabase
      .from("messages")
      .update({ reaction: emoji })
      .eq("id", msgId);
    if (error) console.error("Error updating reaction:", error);
    setReactionPickerMessageId(null);
    setMessages((msgs) =>
      msgs.map((msg) => (msg.id === msgId ? { ...msg, reaction: emoji } : msg))
    );
  };

  // Close Chat: show confirmation modal and update immediately
  const confirmCloseChat = async () => {
    const { error } = await supabase
      .from("tickets")
      .update({ chat_initiated: false })
      .eq("id", ticketId);
    if (error) {
      console.error("Error closing chat:", error);
    } else {
      onChatClosed();
    }
    setShowCloseModal(false);
  };

  // Render messages with date separators and custom footer layout
  const renderMessages = () => {
    let lastDate = "";
    const elements = [];
    messages.forEach((msg, index) => {
      const msgDate = formatDate(msg.created_at);
      if (msgDate !== lastDate) {
        elements.push(
          <div key={`date-${index}`} className="flex justify-center my-2">
            <div className="bg-gray-300 text-gray-800 text-xs px-2 py-1 rounded-full">
              {msgDate}
            </div>
          </div>
        );
        lastDate = msgDate;
      }
      const isCurrentUser = msg.sender_id === currentUser.id;
      elements.push(
        <div key={msg.id} className={`flex ${isCurrentUser ? "justify-start" : "justify-end"}`}>
          <div className={`max-w-xs p-3 rounded-lg shadow relative ${isCurrentUser ? "bg-gray-200" : "bg-blue-100"}`}>
            {msg.image_url && (
              <div className="relative group mb-2">
                <img src={msg.image_url} alt="Uploaded" className="max-w-full h-auto rounded" />
                <button
                  onClick={() => setModalImageUrl(msg.image_url)}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-99 transition-opacity"
                >
                  <FaSearchPlus className="text-white text-3xl bg-black bg-opacity-50 p-2 rounded-full border border-white" />
                </button>
                {/* <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = msg.image_url;
                    link.download = "image.jpg";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaDownload className="text-white text-xl bg-black bg-opacity-50 p-1 rounded-full border border-white" />
                </button> */}
              </div>
            )}
            {msg.content && <p className="text-sm text-gray-800">{msg.content}</p>}
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center space-x-1">
                {isCurrentUser && msg.read_at && <FaCheck className="text-xs text-green-600" />}
                <p className="text-xs text-gray-500">{formatTime(msg.created_at)}</p>
              </div>
              <button className="p-1" onClick={() => handleReactionToggle(msg.id)}>
                {msg.reaction ? msg.reaction : <FaSmile className="opacity-50" />}
              </button>
            </div>
            {reactionPickerMessageId === msg.id && (
              <div className="absolute bottom-full right-0 mb-1 flex space-x-1 bg-white p-1 rounded shadow">
                {emojiOptions.map((emoji) => (
                  <button key={emoji} onClick={() => handleReactionSelect(msg.id, emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    });
    return elements;
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Chat Header with Other Party Info */}
      <div className="flex items-center justify-end mb-2 border-b pb-2">
        <div className="text-right mr-2">
          <p className="font-semibold text-gray-800">{otherPartyInfo?.name || "Other Party"}</p>
          <p className="text-sm text-gray-500">{otherPartyInfo?.role || ""}</p>
        </div>
        {otherPartyInfo?.profile_picture ? (
          <img src={otherPartyInfo.profile_picture} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300" />
        )}
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="mb-2 text-right text-sm text-gray-500">
          {otherPartyInfo?.name || "The other party"} is typing...
        </div>
      )}

      {/* Messages List with Date Separators */}
      <div
        ref={messagesContainerRef}
        className="flex-1 p-4 space-y-3 overflow-y-auto relative"
        onScroll={handleScroll}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {renderMessages()}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll Down Arrow centered above input */}
      {showScrollDown && (
        <button
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white p-2 rounded-full shadow"
          onClick={() => {
            messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: "smooth" });
          }}
        >
          <FaArrowDown />
        </button>
      )}

      {/* Input Section */}
      <div className="border-t p-2">
        {selectedFile && (
          <div className="mb-2 flex items-center">
            <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-12 h-12 rounded mr-2 object-cover" />
            <p className="text-sm text-gray-600">Image selected</p>
          </div>
        )}
        <div className="flex items-center mb-2">
          <label className="cursor-pointer mr-2 flex items-center" onChange={handleTyping}>
            <FaImage className="text-gray-600 hover:text-blue-600" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            {uploadingImage && <FaSpinner className="ml-2 animate-spin text-blue-600" />}
          </label>
          <input
            type="text"
            className="flex-1 border rounded-md p-2 mr-2"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
            disabled={uploadingImage}
          >
            <FaPaperPlane />
            Send
          </button>
        </div>
        <button
          onClick={() => setShowCloseModal(true)}
          className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 flex items-center gap-2"
        >
          <FaTimes />
          Close Chat
        </button>
      </div>

      {/* Confirmation Modal for Close Chat */}
      {showCloseModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded shadow-md w-80">
            <p className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to close chat?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={confirmCloseChat}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => setShowCloseModal(false)}
                className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Image Preview */}
      {modalImageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setModalImageUrl(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img src={modalImageUrl} alt="Modal Preview" className="max-w-full max-h-screen" />
            <button
              onClick={() => setModalImageUrl(null)}
              className="absolute top-2 right-2 text-white text-2xl"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
