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
  const [searchOpen, setSearchOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const searchRef = useRef(null);

  const messageRefs = useRef({});
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
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

  const searchBtnRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Search outside click
      if (
        searchOpen &&
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        searchBtnRef.current &&
        !searchBtnRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
        setMessageSearch("");
        setSearchResults([]);
        setHighlightedMessageId(null);
      }
  
      // Emoji picker outside click
      if (
        showEmojiPicker &&
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
  }, [searchOpen, showEmojiPicker]);
  

  useEffect(() => {
    return () => {
      Fancybox.close();
    };
  }, []);

  useEffect(() => {
    if (!selectedFriend?.uid) {
      setIsFriendTyping(false);
      setReplyingTo(false)
      return;
    }

    const unsubscribe = Firebase.listenTyping(selectedFriend.uid, (typing) => {
      setIsFriendTyping(typing);
    });

    return () => {
      unsubscribe?.();
      setIsFriendTyping(false);
      setReplyingTo(false)
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
  const handleMessageSearch = (value) => {
    setMessageSearch(value);

    const searchText = value.trim().toLowerCase();

    if (!searchText) {
      setSearchResults([]);
      setHighlightedMessageId(null);
      return;
    }

    const results = messages.filter((msg) => {
      if (msg.deleted) return false;

      return msg.text?.toLowerCase().includes(searchText);
    });

    setSearchResults(results);
  };
  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId];

    if (!messageElement) return;

    messageElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setHighlightedMessageId(messageId);

    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2000);
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
    <div className="main-chart-part chat-main-layout position-relative">
      <div className="chat-header d-flex px-4 justify-content-between align-items-center">
        {searchOpen && (
          <div ref={searchRef} className="message-search-panel">
            <div className="message-search-input-wrapper">
              <IoSearch size={18} />

              <input
                type="text"
                autoFocus
                placeholder="Search messages..."
                value={messageSearch}
                onChange={(e) => handleMessageSearch(e.target.value)}
              />

              {messageSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setMessageSearch("");
                    setSearchResults([]);
                  }}
                >
                  <RxCross2 size={18} />
                </button>
              )}
            </div>

            {messageSearch.trim() && (
              <div className="message-search-results">
                {searchResults.map((result) => {
                  const resultDate = result.createdAt?.toDate
                    ? result.createdAt.toDate()
                    : null;

                  const senderName =
                    result.senderId === Firebase.user?.uid
                      ? "You"
                      : selectedFriend.name;

                  return (
                    <div
                      key={result.id}
                      className="message-search-result"
                      onClick={() => scrollToMessage(result.id)}
                    >
                      <div className="message-search-result-header">
                        <span className="message-search-result-sender">
                          {senderName}
                        </span>

                        {resultDate && (
                          <span className="message-search-result-time">
                            {resultDate.toLocaleString([], {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <div className="message-search-result-text">
                        {result.imageUrl && !result.text
                          ? "📷 Photo"
                          : result.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
          <button
            ref={searchBtnRef}
            type="button"
            className="chat-search-btn"
            onClick={(e) => {
              setSearchOpen((e)=>!e);
              console.log(searchOpen, "searchOpen");
              if (searchOpen) {
                setMessageSearch("");
                setSearchResults([]);
                setHighlightedMessageId(null);
              }
            }}
          >
            <IoSearch size={20} />
          </button>

          <MdDeleteForever
            size={21}
            style={{ cursor: "pointer" }}
            data-bs-toggle="modal"
            data-bs-target="#myModal"
          />
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
                ref={(el) => {
                  messageRefs.current[msg.id] = el;
                }}
                onMouseEnter={() => setShowMsgsActionId(msg.id)}
                onMouseLeave={() => setShowMsgsActionId(null)}
                className={`message-row ${
                  isMyMessage ? "my-message-row" : "friend-message-row"
                } ${isGrouped ? "grouped" : ""} ${
                  highlightedMessageId === msg.id ? "message-highlighted" : ""
                }`}
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

                <div
                  className={`position-relative message-bubble asfoh ${
                    isMyMessage ? "my-message" : "friend-message"
                  }`}
                >
                  {msg.replyTo && !msg.deleted && (
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

                  {msg.deleted ? (
                    <em className="deleted-message">
                      This message has been deleted
                    </em>
                  ) : (
                    <>
                      {msg.imageUrl && (
                        <div
                          onClick={() => openImageGallery(msg.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <img
                            src={msg.imageUrl}
                            alt="sent"
                            style={{
                              maxWidth: "220px",
                              borderRadius: "8px",
                              display: "block",
                            }}
                          />
                        </div>
                      )}

                      {msg.text && <MessageText text={msg.text} />}

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
                    </>
                  )}

                  {showMsgsActionId === msg.id && !msg.deleted && (
                    <div
                      className="message-actions-wrapper"
                      onMouseEnter={() => setShowMsgsActionId(msg.id)}
                      onMouseLeave={() => setShowMsgsActionId(null)}
                    >
                      <div className="message-actions">
                        <button
                          type="button"
                          className="message-action-icon"
                          onClick={() => replyToMessage(msg)}
                        >
                          <GoReply size={18} />
                        </button>

                        {isMyMessage && (
                          <MdEdit
                            onClick={() => editingMessage(msg)}
                            color="#1c9641"
                            size={18}
                            className="message-action-icon"
                          />
                        )}

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

        <div ref={messagesEndRef} />
      </div>

      <div className="cf-composer">
        {isFriendTyping && (
          <div className="typing-indicator">
            <span>{selectedFriend.name} is typing...</span>
          </div>
        )}

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
      e.preventDefault();
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
                onClick={() =>{
                  if(showEmojiPicker){
                    setShowEmojiPicker(false)
                  } else{
                    setShowEmojiPicker(true)
                  }
                }}
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

      // Image select hone ke baad message input par focus
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 0);
    }

    e.target.value = "";
  }}
/>


          <button
  type="button"
  className="cf-icon-btn"
  onClick={() => {
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

      <div
        className="modal fade"
        id="myModal"
        tabindex="-1"
        aria-labelledby="myModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0">
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body d-flex align-items-center justify-contnent-center flex-column">
              <p>This will remove chat only from your side.</p>
              <button
                className="border-0 px-3 py-1 text-white rounded-2"
                style={{ background: "#0d8f3d" }}
                data-bs-dismiss="modal"
                onClick={() => {
                  Firebase.clearChatForMe(selectedFriend.uid);
                }}
              >
                Continue
              </button>
            </div>

            <div className="modal-footer border-0">
              <button
                type="button"
                className="border-0 px-3 py-1 text-white rounded-2"
                style={{ background: "#0d8f3d" }}
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainChatPart;
