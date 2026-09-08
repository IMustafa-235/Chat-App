import React, { useEffect, useRef, useState } from "react";
import { IoSearch } from "react-icons/io5";
import { GrEmoji } from "react-icons/gr";
import { VscAttach } from "react-icons/vsc";
import { IoIosSend } from "react-icons/io";
import { useFirebase } from "../context/Firebase";
import img from "./../assets/Untitled_design-removebg-preview.png";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdDeleteForever, MdEdit } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import EmojiPicker from "emoji-picker-react";
import MessageText from "./MessageText";
import { GoReply } from "react-icons/go";

import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

const MainChatPart = ({ selectedFriend }) => {
  const Firebase = useFirebase();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showMsgsActionId, setShowMsgsActionId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const suppressEnterRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!selectedFriend?.uid) {
      setIsOnline(false);
      return;
    }

    const unsubscribe = Firebase.listenUserStatus(
      selectedFriend.uid,
      (status) => {
        setIsOnline(status?.state === "online");
      }
    );

    return () => {
      unsubscribe?.();
    };
  }, [selectedFriend?.uid]);

  useEffect(() => {
    setMessage("");
    setSelectedImage(null);
    setImagePreview(null);
    setEditingMessageId(null);
    setRemoveExistingImage(false);
    if (!selectedFriend?.uid) {
      setMessages([]);
      Firebase.setActiveChat(null);
      return;
    }

    const friendId = selectedFriend.uid;

    Firebase.setActiveChat(friendId);
    Firebase.markAsRead(friendId);

    const unsubscribe = Firebase.listenMessages(friendId, (data) => {
      setMessages(data);
    });

    return () => {
      unsubscribe?.();
      Firebase.setActiveChat(null);
    };
  }, [selectedFriend?.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "instant",
    });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      Fancybox.close();
    };
  }, []);

  useEffect(() => {
    if (!selectedFriend?.uid) {
      setIsFriendTyping(false);
      return;
    }

    const unsubscribe = Firebase.listenTyping(selectedFriend.uid, (typing) => {
      console.log(typing, "typing");
      setIsFriendTyping(typing);
    });

    return () => {
      unsubscribe?.();
      setIsFriendTyping(false);
    };
  }, [selectedFriend?.uid]);

  const handleTyping = (value) => {
    setMessage(value);

    if (!selectedFriend?.uid) return;

    const friendId = selectedFriend.uid;

    // Previous timer cancel
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Empty input => immediately stop typing
    if (!value.trim()) {
      Firebase.setTyping(friendId, false);
      return;
    }

    // User is typing
    Firebase.setTyping(friendId, true);

    // 1.5 sec after last keypress => stop typing
    typingTimeoutRef.current = setTimeout(() => {
      Firebase.setTyping(friendId, false);
      typingTimeoutRef.current = null;
    }, 1500);
  };

  const handleSendMessage = async () => {
    const trimmed = message.trim();

    // edit mode mein: agar naya image select hai YA (purani image thi aur remove nahi ki)
    // to samjho image abhi bhi rahegi
    const willHaveImage = editingMessageId
      ? selectedImage || (imagePreview && !removeExistingImage)
      : selectedImage;

    if (!trimmed && !willHaveImage) {
      return;
    }

    if (sending) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    await Firebase.setTyping(selectedFriend.uid, false);

    setSending(true);

    try {
      if (editingMessageId) {
        await Firebase.editMessage(
          selectedFriend.uid,
          editingMessageId,
          trimmed,
          selectedImage, // naya image (ya null)
          removeExistingImage // ✅ explicit remove flag
        );

        setEditingMessageId(null);
        setMessage("");
        setSelectedImage(null);
        setImagePreview(null);
        setRemoveExistingImage(false);

        return;
      }

      const imageToSend = selectedImage;

      await Firebase.sendMessage(
        selectedFriend.uid,
        trimmed,
        imageToSend,
        replyingTo
      );

      await Firebase.setTyping(selectedFriend.uid, false);

      setMessage("");
      setReplyingTo(null);
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Message error:", error);
    } finally {
      setSending(false);
    }
  };
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (selectedFriend?.uid) {
        Firebase.setTyping(selectedFriend.uid, false);
      }
    };
  }, [selectedFriend?.uid]);

  const editingMessage = (msg) => {
    setEditingMessageId(msg.id);
    setMessage(msg.text || "");
    setRemoveExistingImage(false);

    if (msg.imageUrl) {
      setImagePreview(msg.imageUrl);
    } else {
      setImagePreview(null);
    }

    setSelectedImage(null);
    setShowMsgsActionId(null);

    setTimeout(() => {
      messageInputRef.current?.focus();

      messageInputRef.current?.setSelectionRange(
        (msg.text || "").length,
        (msg.text || "").length
      );
    }, 0);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setMessage("");
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveExistingImage(false);
  };

  const deleteMessage = (messageId) => {
    Firebase.deleteMessage(selectedFriend.uid, messageId);
    setEditingMessageId(null);
    setMessage("");
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);

    messageInputRef.current?.focus();
  };

  const openImageGallery = (currentMessageId) => {
    const imageMessages = messages.filter((msg) => msg.imageUrl);

    if (!imageMessages.length) {
      return;
    }

    const slides = imageMessages.map((msg) => ({
      src: msg.imageUrl,
      type: "image",
      caption: msg.text || "",
    }));

    const startIndex = imageMessages.findIndex(
      (msg) => msg.id === currentMessageId
    );

    Fancybox.show(slides, {
      startIndex: startIndex >= 0 ? startIndex : 0,

      Toolbar: {
        display: {
          left: [],
          middle: [],
          right: ["close"],
        },
      },

      Thumbs: {
        type: "classic",
      },

      Images: {
        zoom: true,
      },

      Carousel: {
        infinite: true,
      },
    });
  };
  const replyToMessage = (msg) => {
    setReplyingTo(msg);
    setShowMsgsActionId(null);

    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 0);
  };

  if (!selectedFriend) {
    return (
      <div className="main-chart-part chat-empty-state">
        <img
          src={img}
          alt=""
          style={{
            width: "260px",
            height: "260px",
            objectFit: "contain",
            display: "block",
          }}
        />

        <h5 className="mb-1">Select a conversation</h5>

        <p className="mb-0">Pick someone from the sidebar to start chatting</p>
      </div>
    );
  }

  return (
    <div className="main-chart-part chat-main-layout">
      <div className="chat-header d-flex px-4 justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded-circle chat-user-avatar">
            {selectedFriend.name
              ?.trim()
              .split(" ")[0]
              ?.charAt(0)
              ?.toUpperCase()}
          </div>

          <div>
            <h6 className="mb-1">{selectedFriend.name}</h6>

            <p className="mb-0 chat-status">
              <span
                className={`chat-status-dot ${isOnline ? "online" : "offline"}`}
              />

              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-4 chat-header-icons">
          <IoSearch size={20} />
          <MdDeleteForever size={21} />
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat-message">
            <div className="empty-chat-avatar">
              {selectedFriend.name
                ?.trim()
                .split(" ")[0]
                ?.charAt(0)
                ?.toUpperCase()}
            </div>

            <h5>{selectedFriend.name}</h5>

            <p>Say hello and start the conversation</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMyMessage = msg.senderId === Firebase.user?.uid;

            const prevMsg = messages[index - 1];

            const currentTime = msg.createdAt?.toDate
              ? msg.createdAt.toDate()
              : null;

            const previousTime = prevMsg?.createdAt?.toDate
              ? prevMsg.createdAt.toDate()
              : null;

            const sameSender = prevMsg && prevMsg.senderId === msg.senderId;

            const timeDifference =
              currentTime && previousTime
                ? (currentTime - previousTime) / (1000 * 60)
                : Infinity;

            const showMeta = !sameSender || timeDifference > 10;

            const isGrouped = !showMeta;

            const messageDateTime = currentTime
              ? currentTime.toLocaleString([], {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <div
                key={msg.id}
                onMouseEnter={() => setShowMsgsActionId(msg.id)}
                onMouseLeave={() => setShowMsgsActionId(null)}
                className={`message-row ${
                  isMyMessage ? "my-message-row" : "friend-message-row"
                } ${isGrouped ? "grouped" : ""}`}
              >
                {/* MESSAGE META */}
                {showMeta && (
                  <div className="message-meta">
                    <span className="message-sender-name">
                      {isMyMessage ? "You" : selectedFriend.name}
                    </span>

                    <span className="message-time">{messageDateTime}</span>
                  </div>
                )}

                {/* MESSAGE BUBBLE */}
                <div
                  className={`position-relative message-bubble ${
                    isMyMessage ? "my-message" : "friend-message"
                  } ${msg.imageUrl ? "anfs" : "asfoh"}`}
                >
                  {msg.replyTo && (
                    <div
                      className={`message-reply-preview ${
                        isMyMessage
                          ? "reply-preview-my"
                          : "reply-preview-friend"
                      }`}
                    >
                      <div className="message-reply-name">
                        {msg.replyTo.senderId === Firebase.user?.uid
                          ? "You"
                          : selectedFriend.name}
                      </div>

                      <div className="message-reply-content">
                        {msg.replyTo.imageUrl && !msg.replyTo.text
                          ? "📷 Photo"
                          : msg.replyTo.text || "📷 Photo"}
                      </div>
                    </div>
                  )}
                  {msg.imageUrl && (
                    <div
                      onClick={() => openImageGallery(msg.id)}
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      <img
                        src={msg.imageUrl}
                        alt="sent"
                        onLoad={() => {
                          messagesEndRef.current?.scrollIntoView({
                            behavior: "instant",
                          });
                        }}
                        style={{
                          maxWidth: "220px",
                          borderRadius: "8px",
                          display: "block",
                          marginBottom: msg.text ? "4px" : "0",
                        }}
                      />
                    </div>
                  )}

                  {/* TEXT */}
                  {msg.text && <MessageText text={msg.text} />}

                  {/* EDITED */}
                  {msg.edited && (
                    <span
                      style={{
                        fontSize: "10px",
                        marginLeft: "6px",
                        opacity: 0.6,
                      }}
                    >
                      edited
                    </span>
                  )}

                  {/* ACTIONS */}
                  {/* ACTIONS */}
                  {showMsgsActionId === msg.id && (
                    <div
                      className="message-actions-wrapper"
                      onMouseEnter={() => setShowMsgsActionId(msg.id)}
                      onMouseLeave={() => setShowMsgsActionId(null)}
                    >
                      <div className="message-actions">
                        {/* REPLY */}
                        <button
                          type="button"
                          className="message-action-icon"
                          onClick={() => replyToMessage(msg)}
                        >
                          <GoReply size={18} />
                        </button>

                        {/* EDIT */}
                        {isMyMessage && (
                          <MdEdit
                            onClick={() => editingMessage(msg)}
                            color="#1c9641"
                            size={18}
                            className="message-action-icon"
                          />
                        )}

                        {/* DELETE */}
                        {isMyMessage && (
                          <RiDeleteBin6Line
                            onClick={() => deleteMessage(msg.id)}
                            color="#1c9641"
                            size={18}
                            className="message-action-icon"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isFriendTyping && (
          <div className="typing-indicator">
            <span>{selectedFriend.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="cf-composer">
        {replyingTo && (
          <div className="reply-preview">
            <div className="reply-preview-content">
              <div className="reply-preview-title">
                Replying to{" "}
                <strong>
                  {replyingTo.senderId === Firebase.user?.uid
                    ? "You"
                    : selectedFriend.name}
                </strong>
              </div>

              <div className="reply-preview-message">
                {replyingTo.imageUrl && !replyingTo.text
                  ? "📷 Photo"
                  : replyingTo.text || "📷 Photo"}
              </div>
            </div>

            <button
              type="button"
              className="reply-preview-close"
              onClick={() => setReplyingTo(null)}
            >
              <RxCross2 size={16} />
            </button>
          </div>
        )}

        <div
          className={`cf-composer-shell ${
            !imagePreview ? "cf-composer-shell--compact" : ""
          }`}
        >
          <input
            ref={messageInputRef}
            type="text"
            className="cf-composer-input"
            placeholder={`Message ${selectedFriend.name}`}
            value={message}
            onChange={(e) => {
              handleTyping(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (suppressEnterRef.current) {
                  e.preventDefault();
                  return;
                }

                handleSendMessage();
              }

              if (e.key === "Escape" && editingMessageId) {
                cancelEditMessage();
              }
            }}
          />

          {imagePreview && (
            <div className="cf-attachment-row">
              <div className="cf-attachment-card">
                <div className="cf-attachment-icon">
                  <img src={imagePreview} alt="attachment" />
                </div>

                <div className="cf-attachment-text">
                  <div className="cf-attachment-title">
                    {selectedImage?.name || "Image"}
                  </div>

                  <div className="cf-attachment-subtitle">Ready to send</div>
                </div>
                <div
                  className="cf-attachment-close"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);

                    // Agar edit mode mein hain aur ye existing image thi (naya file nahi tha)
                    // to explicitly mark karo ki image remove karni hai
                    if (editingMessageId) {
                      setRemoveExistingImage(true);
                    }
                  }}
                >
                  <RxCross2 size={14} />
                </div>
              </div>
            </div>
          )}

          <div className="cf-composer-toolbar">
            {/* CANCEL EDIT */}
            {editingMessageId && (
              <button
                type="button"
                className="cf-cancel-edit-btn"
                onClick={cancelEditMessage}
              >
                <RxCross2 size={14} strokeWidth={1} />
              </button>
            )}

            {/* EMOJI */}
            {/* EMOJI */}
            <div className="cf-emoji-wrap" ref={emojiPickerRef}>
              <button
                type="button"
                className={`cf-icon-btn ${
                  showEmojiPicker ? "cf-icon-active" : ""
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              >
                <GrEmoji size={18} />
              </button>

              {showEmojiPicker && (
                <div className="cf-emoji-popover">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme="light"
                    width={320}
                    height={400}
                    searchDisabled={false}
                    skinTonesDisabled={false}
                  />
                </div>
              )}
            </div>

            {/* FILE INPUT */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{
                display: "none",
              }}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  setSelectedImage(file);

                  setImagePreview(URL.createObjectURL(file));
                }

                suppressEnterRef.current = true;

                setTimeout(() => {
                  suppressEnterRef.current = false;
                }, 300);

                e.target.value = "";
              }}
            />

            {/* ATTACH */}
            <button
              type="button"
              className="cf-icon-btn"
              onClick={() => {
                messageInputRef.current?.blur();
                fileInputRef.current?.click();
              }}
            >
              <VscAttach size={18} />
            </button>

            {/* SEND */}
            <button
              type="button"
              className="cf-send-btn"
              onClick={handleSendMessage}
              disabled={(!message.trim() && !selectedImage) || sending}
            >
              <IoIosSend size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainChatPart;
