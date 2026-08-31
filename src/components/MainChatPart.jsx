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

const MainChatPart = ({ selectedFriend }) => {
  const Firebase = useFirebase();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showMsgsActionId, setShowMsgsActionId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  useEffect(() => {
    if (!selectedFriend?.uid) return;

    const unsubscribe = Firebase.listenUserStatus(
      selectedFriend.uid,
      (status) => {
        setIsOnline(status?.state === "online");
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedFriend?.uid]);

  useEffect(() => {
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
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    if (editingMessageId) {
      await Firebase.editMessage(selectedFriend.uid, editingMessageId, trimmed);
      setEditingMessageId(null);
      setMessage("");
      return;
    }
    setMessage("");
    setSending(true);
    try {
      await Firebase.sendMessage(selectedFriend.uid, trimmed);
    } catch (error) {
      if (editingMessageId) {
        setMessage(trimmed);
      } else {
        setMessage(trimmed);
      }
    } finally {
      setSending(false);
    }
  };
  const editingMessage = (msg) => {
    setEditingMessageId(msg.id);
    setMessage(msg.text);
    setShowMsgsActionId(null);
    setTimeout(() => {
      messageInputRef.current?.focus()
      messageInputRef.current?.setSelectionRange(
        msg.text.length,
        msg.text.length
      )
    }, 0);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setMessage("");
  };

  const deleteMessage = (e) => {
    Firebase.deleteMessage(selectedFriend.uid, e);
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
                onMouseEnter={() => setShowMsgsActionId(msg.id)}
                onMouseLeave={() => {
                  setShowMsgsActionId(null);
                }}
                key={msg.id}
                className={`message-row ${
                  isMyMessage ? "my-message-row" : "friend-message-row"
                } ${isGrouped ? "grouped" : ""}`}
              >
                {showMeta && (
                  <div className="message-meta">
                    <span className="message-sender-name">
                      {isMyMessage ? "You" : selectedFriend.name}
                    </span>

                    <span className="message-time">{messageDateTime}</span>
                  </div>
                )}

                <div
                  className={`position-relative message-bubble ${
                    isMyMessage ? "my-message" : "friend-message"
                  }`}
                >
                  {msg.text}
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
                  {isMyMessage && showMsgsActionId === msg.id && (
                    <div>
                      <div
                        className="position-absolute z-3"
                        style={{ left: "5px", bottom: "5px" }}
                      >
                        <div
                          className={`d-flex rounded-3 position-absolute`}
                          style={{
                            right: "0%",
                            top: "-50%",
                            background: "#d8f3e2",
                            padding: "2px 7px",
                          }}
                        >
                          <MdEdit
                            onClick={(e) => editingMessage(msg)}
                            color="#1c9641"
                            className="pe-1"
                            size={20}
                            style={{
                              borderRight: "1px solid #1c9641",
                              cursor: "pointer",
                            }}
                          />
                          <RiDeleteBin6Line
                            onClick={() => deleteMessage(msg.id)}
                            color="#1c9641"
                            className="ps-1"
                            style={{ cursor: "pointer" }}
                            size={20}
                          />
                        </div>
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

      <div className="chat-input-wrapper">
        <div className="message-input-parent rounded-4">
          <input
          ref={messageInputRef}
            type="text"
            className="message-input"
            placeholder={`Message ${selectedFriend.name}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
              if (e.key === "Escape" && editingMessageId) {
                cancelEditMessage();
              }
            }}
          />
          <div className="d-flex align-items-center gap-3 pe-3 chat-input-icons">
          {editingMessageId && (
              <button
                type="button" className="d-flex align-items-center justify-content-center rounded-circle border-0"
                onClick={cancelEditMessage}
                style={{
                  background: "transparent",
                  backgroundColor: "#777",
                  fontSize:"11px",
                  padding:"4px",
                  cursor: "pointer",
                }}
              >
                <RxCross2  color="white" strokeWidth={1}/>
              </button>
            )}
            <GrEmoji size={20} />
            <VscAttach size={20} />

            <button
              className="send-message-btn"
              onClick={handleSendMessage}
              disabled={!message.trim() || sending}
            >
              <IoIosSend size={21} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainChatPart;
