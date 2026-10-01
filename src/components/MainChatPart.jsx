import React, { useEffect, useRef, useState } from "react";
import { IoSearch } from "react-icons/io5";
import { GrEmoji } from "react-icons/gr";
import { VscAttach } from "react-icons/vsc";
import { IoIosSend } from "react-icons/io";
import { useFirebase } from "../context/Firebase";
import img from "./../assets/Untitled_design-removebg-preview.png";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdDeleteForever, MdEdit, MdOutlineLogout } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import EmojiPicker from "emoji-picker-react";
import MessageText from "./MessageText";
import { GoReply } from "react-icons/go";
import { FaFileAlt } from "react-icons/fa";
import { Fancybox } from "@fancyapps/ui";
import { HiDotsVertical } from "react-icons/hi";
import { RiGroupLine } from "react-icons/ri";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { BiUserPlus } from "react-icons/bi";
import { toast } from "react-toastify";

const MainChatPart = ({ selectedFriend }) => {
  const Firebase = useFirebase();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showMsgsActionId, setShowMsgsActionId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [groupMembersMap, setGroupMembersMap] = useState({});
  const [groupMainSettingBox, setGroupMainSettingBox] = useState(false);
  const [groupMembersList, setGroupMembersList] = useState([]);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [typingUserIds, setTypingUserIds] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [onlineGroupMembers, setOnlineGroupMembers] = useState({});
  const [editingFileInfo, setEditingFileInfo] = useState(null);

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
  const groupSettingRef = useRef(null);
  const groupSettingBtnRef = useRef(null);

  useEffect(() => {
    if (!selectedFriend?.uid || selectedFriend.isGroup) {
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
  }, [selectedFriend?.uid, selectedFriend?.isGroup]);
  useEffect(() => {
    setMessage("");
    setSelectedFile(null);
    setFilePreview(null);
    setEditingMessageId(null);
    setRemoveExistingImage(false);
    setEditingFileInfo(null); 

    if (!selectedFriend?.uid) {
      setMessages([]);
      Firebase.setActiveChat(null);
      return;
    }
    if (selectedFriend.isGroup) {
      Firebase.setActiveChat(selectedFriend.uid);
      Firebase.markGroupAsRead(selectedFriend.uid);

      const unsubscribe = Firebase.listenGroupMessages(
        selectedFriend.uid,
        (data) => setMessages(data)
      );

      return () => {
        unsubscribe?.();
        Firebase.setActiveChat(null);
      };
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
  }, [selectedFriend?.uid, selectedFriend?.isGroup]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "instant",
    });
  }, [messages]);

  const searchBtnRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
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

      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        groupMainSettingBox &&
        groupSettingRef.current &&
        !groupSettingRef.current.contains(event.target) &&
        groupSettingBtnRef.current &&
        !groupSettingBtnRef.current.contains(event.target)
      ) {
        setGroupMainSettingBox(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchOpen, showEmojiPicker, groupMainSettingBox]);

  useEffect(() => {
    return () => {
      Fancybox.close();
    };
  }, []);

  useEffect(() => {
    if (!selectedFriend?.uid || selectedFriend.isGroup) {
      setIsFriendTyping(false);
      setReplyingTo(false);
      return;
    }

    const unsubscribe = Firebase.listenTyping(selectedFriend.uid, (typing) => {
      setIsFriendTyping(typing);
    });

    return () => {
      unsubscribe?.();
      setIsFriendTyping(false);
      setReplyingTo(false);
    };
  }, [selectedFriend?.uid, selectedFriend?.isGroup]);

  const handleTyping = (value) => {
    setMessage(value);
  
    if (!selectedFriend?.uid) return;
  
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  
    const isTyping = value.trim().length > 0;
  
    if (selectedFriend.isGroup) {
      Firebase.setGroupTyping(selectedFriend.uid, isTyping);
    } else {
      Firebase.setTyping(selectedFriend.uid, isTyping);
    }
  };

  const handleSendMessage = async () => {
    const trimmed = message.trim();
    const willHaveFile = editingMessageId
      ? selectedFile || (filePreview && !removeExistingImage)
      : selectedFile;
  
    if (!trimmed && !willHaveFile) {
      return;
    }
  
    if (sending) {
      return;
    }
  
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  
    if (selectedFriend.isGroup) {
      Firebase.setGroupTyping(selectedFriend.uid, false);
    } else {
      Firebase.setTyping(selectedFriend.uid, false);
    }
  
    const fileToSend = selectedFile;
    const replyToSend = replyingTo;
  
    if (!editingMessageId) {
      setMessage("");
      setReplyingTo(null);
      setSelectedFile(null);
      setFilePreview(null);
    }
  
    setSending(true);
  
    try {
      if (editingMessageId) {
        if (selectedFriend.isGroup) {
          await Firebase.editGroupMessage(
            selectedFriend.uid,
            editingMessageId,
            trimmed,
            selectedFile,
            removeExistingImage
          );
        } else {
          await Firebase.editMessage(
            selectedFriend.uid,
            editingMessageId,
            trimmed,
            selectedFile,
            removeExistingImage
          );
        }
  
        setEditingMessageId(null);
        setMessage("");
        setSelectedFile(null);
        setFilePreview(null);
        setRemoveExistingImage(false);
        setEditingFileInfo(null);
  
        return;
      }
  
      if (selectedFriend.isGroup) {
        await Firebase.sendGroupMessage(
          selectedFriend.uid,
          trimmed,
          fileToSend,
          replyToSend
        );
      } else {
        await Firebase.sendMessage(
          selectedFriend.uid,
          trimmed,
          fileToSend,
          replyToSend
        );
      }
    } catch (error) {
      toast.error(error.message || "Failed to send message");
  
      if (!editingMessageId) {
        setMessage(trimmed);
      }
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

      if (selectedFriend?.uid && !selectedFriend.isGroup) {
        Firebase.setTyping(selectedFriend.uid, false);
      }
    };
  }, [selectedFriend?.uid, selectedFriend?.isGroup]);

  const editingMessage = (msg) => {
    setEditingMessageId(msg.id);
    setMessage(msg.text || "");
    setRemoveExistingImage(false);
  
    if (msg.fileUrl) {
      setFilePreview(msg.fileUrl);
      setEditingFileInfo({
        name: msg.fileName || "Attached file",
        type: msg.fileType || "",
      });
    } else {
      setFilePreview(null);
      setEditingFileInfo(null);
    }
  
    setSelectedFile(null);
    setShowMsgsActionId(null);

    setTimeout(() => {
      messageInputRef.current?.focus();

      messageInputRef.current?.setSelectionRange(
        (msg.text || "").length,
        (msg.text || "").length
      );
    }, 0);
  };
  useEffect(() => {
    if (!selectedFriend?.uid || !selectedFriend.isGroup) {
      setTypingUserIds([]);
      return;
    }
  
    const unsubscribe = Firebase.listenGroupTyping(selectedFriend.uid, (ids) => {
      setTypingUserIds(ids);
    });
  
    return () => {
      unsubscribe?.();
      setTypingUserIds([]);
    };
  }, [selectedFriend?.uid, selectedFriend?.isGroup]);
  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setMessage("");
    setSelectedFile(null);
    setFilePreview(null);
    setRemoveExistingImage(false);
    setEditingFileInfo(false)
  };

  const deleteMessage = (messageId) => {
    if (selectedFriend.isGroup) {
      Firebase.deleteGroupMessage(selectedFriend.uid, messageId);
    } else {
      Firebase.deleteMessage(selectedFriend.uid, messageId);
    }
    setEditingMessageId(null);
    setMessage("");
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);

    messageInputRef.current?.focus();
  };

  const openImageGallery = (currentMessageId) => {
    const imageMessages = messages.filter(
      (msg) => msg.fileUrl && msg.fileType?.startsWith("image/")
    );

    if (!imageMessages.length) {
      return;
    }

    const slides = imageMessages.map((msg) => ({
      src: msg.fileUrl,
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
  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  useEffect(() => {
    if (!selectedFriend?.isGroup || !selectedFriend?.members?.length) {
      setGroupMembersMap({});
      setGroupMembersList([]);
      return;
    }

    const fetchMembers = async () => {
      const membersInfo = await Firebase.getGroupMembersInfo(
        selectedFriend.members
      );
      const map = {};
      membersInfo.forEach((m) => {
        map[m.uid] = m.name;
      });
      setGroupMembersMap(map);
      setGroupMembersList(membersInfo);
    };

    fetchMembers();
  }, [selectedFriend?.uid, selectedFriend?.isGroup, selectedFriend?.members]);

  const isOwner =
    selectedFriend?.isGroup && selectedFriend?.createdBy === Firebase.user?.uid;

  const handleRemoveMember = async (memberId) => {
    if (!isOwner) return;
    if (memberId === selectedFriend.createdBy) return;

    try {
      await Firebase.removeGroupMember(selectedFriend.uid, memberId);
      setGroupMembersList((prev) => prev.filter((m) => m.uid !== memberId));
    } catch (error) {
      toast.error(error);
    }
  };

  const handleDeleteGroup = async () => {
    setGroupMainSettingBox(false);

    try {
      await Firebase.deleteGroup(selectedFriend.uid);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLeaveGroup = async () => {
    setGroupMainSettingBox(false);

    try {
      await Firebase.leaveGroup(selectedFriend.uid);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = Firebase.listenFreinds((data) => setFriendsList(data));
    return () => unsubscribe?.();
  }, [Firebase.user?.uid]);

  const addableFriends = friendsList.filter((f) => {
    if (selectedFriend?.members?.includes(f.uid)) return false;
    const text = addMemberSearch.trim().toLowerCase();
    if (!text) return true;
    return (
      f.name?.toLowerCase().includes(text) ||
      f.email?.toLowerCase().includes(text)
    );
  });

  const handleAddMembers = async () => {
    if (!selectedNewMembers.length) return;

    const currentCount = selectedFriend?.members?.length || 0;
    if (currentCount + selectedNewMembers.length > 8) {
      toast.error("A group can have a maximum of 8 members.");
    }

    try {
      await Firebase.addGroupMembers(
        selectedFriend.uid,
        selectedNewMembers.map((m) => m.uid)
      );
      setSelectedNewMembers([]);
      setAddMemberSearch("");
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
  
      if (selectedFriend?.uid) {
        if (selectedFriend.isGroup) {
          Firebase.setGroupTyping(selectedFriend.uid, false);
        } else {
          Firebase.setTyping(selectedFriend.uid, false);
        }
      }
    };
  }, [selectedFriend?.uid, selectedFriend?.isGroup]);

  useEffect(() => {
    if (!selectedFriend?.isGroup || !selectedFriend?.members?.length) {
      setOnlineGroupMembers({});
      return;
    }
  
    const unsubscribes = selectedFriend.members.map((memberId) => {
      return Firebase.listenUserStatus(memberId, (status) => {
        setOnlineGroupMembers((prev) => ({
          ...prev,
          [memberId]: status?.state === "online",
        }));
      });
    });
  
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe?.());
      setOnlineGroupMembers({});
    };
  }, [selectedFriend?.uid, selectedFriend?.isGroup, selectedFriend?.members?.join(",")]); 

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
                      : selectedFriend.isGroup
                      ? groupMembersMap[result.senderId] || "Unknown"
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
          {selectedFriend.isGroup ? (
                <RiGroupLine size={18} />
              ) : (
                selectedFriend.name
                  ?.trim()
                  .split(" ")[0]
                  ?.charAt(0)
                  ?.toUpperCase()
              )}
          </div>

          <div>
            <h6 className="mb-1">{selectedFriend.name}</h6>

            <p className="mb-0 chat-status">
              {selectedFriend.isGroup ? (
                `${selectedFriend.members?.length || 0} members`
              ) : (
                <>
                  <span
                    className={`chat-status-dot ${
                      isOnline ? "online" : "offline"
                    }`}
                  />
                  {isOnline ? "Online" : "Offline"}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-4 chat-header-icons">
          <button
            ref={searchBtnRef}
            type="button"
            className="chat-search-btn"
            onClick={(e) => {
              setSearchOpen((e) => !e);
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
          <HiDotsVertical
            size={20}
            className={selectedFriend.isGroup ? "d-block" : "d-none"}
            ref={groupSettingBtnRef}
            onClick={() => setGroupMainSettingBox((e) => !e)}
          />
          <div
            className={` flex-column gap-3 rounded-2 border-1 position-absolute message-search-panel ${
              groupMainSettingBox ? "d-flex" : "d-none"
            }`}
            style={{ width: "fit-content", right: "20px", padding: "8px 13px" }}
            ref={groupSettingRef}
          >
            <div className="d-flex align-items-center gap-2 aknlf">
              <RiGroupLine color="black" />
              <span
                style={{ fontSize: "14px" }}
                data-bs-toggle="modal"
                data-bs-target="#groupMembersModal"
                onClick={() => setGroupMainSettingBox(false)}
              >
                Group members
              </span>
            </div>
            {isOwner && (
              <div className="d-flex align-items-center gap-2 aknlf">
                <BiUserPlus color="black" size={22} />
                <span
                  style={{ fontSize: "14px" }}
                  data-bs-toggle="modal"
                  data-bs-target="#groupAddMembersModal"
                  onClick={() => setGroupMainSettingBox(false)}
                >
                  Add members
                </span>
              </div>
            )}

            <div
              className="d-flex align-items-center gap-2 aknlf"
              onClick={handleLeaveGroup}
            >
              <MdOutlineLogout color="black" />
              <span style={{ fontSize: "14px" }}>Leave group</span>
            </div>
            <div
              className={` align-items-center gap-2 aknlf ${
                isOwner ? "d-flex" : "d-none"
              }`}
              onClick={handleDeleteGroup}
            >
              <RiDeleteBin6Line color="black" />
              <span style={{ fontSize: "14px" }}>Delete group</span>
            </div>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat-message">
            <div className="empty-chat-avatar">
              {selectedFriend.isGroup ? (
                <RiGroupLine size={28} />
              ) : (
                selectedFriend.name
                  ?.trim()
                  .split(" ")[0]
                  ?.charAt(0)
                  ?.toUpperCase()
              )}
            </div>

            <h5>{selectedFriend.name}</h5>

            {selectedFriend.isGroup ? (
              <>
                <p className="mb-1">
                  {selectedFriend.members?.length || 0} members
                </p>
                <p>No messages yet. Say hi to the group!</p>
              </>
            ) : (
              <p>Say hello and start the conversation</p>
            )}
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
                {showMeta && (
                  <div className="message-meta">
                    <span className="message-sender-name">
                      {isMyMessage
                        ? "You"
                        : selectedFriend.isGroup
                        ? groupMembersMap[msg.senderId] || "Unknown"
                        : selectedFriend.name}
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
                      style={{ cursor: "pointer" }}
                      onClick={() => scrollToMessage(msg.replyTo.id)}
                    >
                      <div className="message-reply-name">
                        {msg.replyTo.senderId === Firebase.user?.uid
                          ? "You"
                          : selectedFriend.isGroup
                          ? groupMembersMap[msg.replyTo.senderId] || "Unknown"
                          : selectedFriend.name}
                      </div>

                      <div className="message-reply-content">
                      {msg.replyTo.text
  ? msg.replyTo.text
  : msg.replyTo.fileType?.startsWith("image/")
  ? "📷 Photo"
  : msg.replyTo.fileName
  ? `📄 ${msg.replyTo.fileName}`
  : "📷 Photo"}
                      </div>
                    </div>
                  )}

                  {msg.deleted ? (
                    <em className="deleted-message">
                      This message has been deleted
                    </em>
                  ) : (
                    <>
                      {msg.fileUrl && msg.fileType?.startsWith("image/") && (
                        <div
                          onClick={() => openImageGallery(msg.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <img
                            src={msg.fileUrl}
                            alt={msg.fileName || "sent"}
                            onLoad={() => {
                              messagesEndRef.current?.scrollIntoView({
                                behavior: "instant",
                              });
                            }}
                            style={{
                              maxWidth: "220px",
                              maxHeight: "220px",
                              borderRadius: "8px",
                              display: "block",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      )}
                      {msg.fileUrl && !msg.fileType?.startsWith("image/") && (
                        <div
                          onClick={async () => {
                            try {
                              const downloadUrl =
                                `https://cloudinary-delete-server-kt67.onrender.com/signed-download-url` +
                                `?publicId=${encodeURIComponent(
                                  msg.filePublicId
                                )}` +
                                `&resourceType=${encodeURIComponent(
                                  msg.fileResourceType || "raw"
                                )}` +
                                `&fileName=${encodeURIComponent(
                                  msg.fileName || "file"
                                )}`;

                              const response = await fetch(downloadUrl);

                              if (!response.ok) {
                                throw new Error("File download failed");
                              }

                              const blob = await response.blob();

                              const blobUrl = URL.createObjectURL(blob);

                              const link = document.createElement("a");
                              link.href = blobUrl;
                              link.download = msg.fileName || "file";

                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);

                              URL.revokeObjectURL(blobUrl);
                            } catch (error) {
                              console.error(error);
                              alert("File download failed.");
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            minWidth: "220px",
                            maxWidth: "280px",
                            padding: "10px",
                            borderRadius: "10px",
                            textDecoration: "none",
                            background: isMyMessage
                              ? "rgba(255,255,255,0.12)"
                              : "#f5f5f5",
                            color: "inherit",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#1c9641",
                              color: "#fff",
                              fontSize: "20px",
                              flexShrink: 0,
                            }}
                          >
                            <FaFileAlt />
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {msg.fileName || "File"}
                            </div>

                            <div
                              style={{
                                fontSize: "11px",
                                opacity: 0.65,
                                marginTop: "3px",
                              }}
                            >
                              {formatFileSize(msg.fileSize)} • Download
                            </div>
                          </div>
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
      {selectedFriend.isGroup ? (
  typingUserIds.length > 0 && (
    <div className="typing-indicator">
      <span>
        {typingUserIds
          .map((uid) => groupMembersMap[uid] || "Someone")
          .join(", ")}{" "}
        {typingUserIds.length === 1 ? "is" : "are"} typing...
      </span>
    </div>
  )
) : (
  isFriendTyping && (
    <div className="typing-indicator">
      <span>{selectedFriend.name} is typing...</span>
    </div>
  )
)}

        {replyingTo && (
          <div className="reply-preview">
            <div className="reply-preview-content">
              <div className="reply-preview-title">
                Replying to{" "}
                <strong>
                  {replyingTo.senderId === Firebase.user?.uid
                    ? "You"
                    : selectedFriend.isGroup
                    ? groupMembersMap[replyingTo.senderId] || "Unknown"
                    : selectedFriend.name}
                </strong>
              </div>

              <div className="reply-preview-message">
              {replyingTo.text
  ? replyingTo.text
  : replyingTo.fileType?.startsWith("image/")
  ? "📷 Photo"
  : replyingTo.fileName
  ? `📄 ${replyingTo.fileName}`
  : "📷 Photo"}
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
            !setFilePreview ? "cf-composer-shell--compact" : ""
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

{(selectedFile || filePreview) && (
  <div className="cf-attachment-row">
    <div className="cf-attachment-card">
      <div className="cf-attachment-icon">
        {filePreview &&
        (selectedFile
          ? selectedFile.type.startsWith("image/")
          : editingFileInfo?.type?.startsWith("image/")) ? (
          <img src={filePreview} alt={selectedFile?.name || editingFileInfo?.name} />
        ) : (
          <FaFileAlt size={24} color="#1c9641" />
        )}
      </div>

      <div className="cf-attachment-text">
        <div className="cf-attachment-title">
          {selectedFile?.name || editingFileInfo?.name || "Attachment"}
        </div>

        <div className="cf-attachment-subtitle">
          {selectedFile
            ? `${formatFileSize(selectedFile.size)} • Ready to send`
            : "Current attachment"}
        </div>
      </div>

      <button
        type="button"
        className="cf-attachment-close"
        onClick={() => {
          setSelectedFile(null);
          setFilePreview(null);
          setEditingFileInfo(null);

          if (editingMessageId) {
            setRemoveExistingImage(true);
          }
        }}
      >
        <RxCross2 size={14} />
      </button>
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
                onClick={() => {
                  if (showEmojiPicker) {
                    setShowEmojiPicker(false);
                  } else {
                    setShowEmojiPicker(true);
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
              accept="*/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.name.toLowerCase().endsWith(".exe")) {
                    alert("You cant send EXE files.");
                    e.target.value = "";
                    return;
                  }
                  setSelectedFile(file);

                  if (file.type.startsWith("image/")) {
                    setFilePreview(URL.createObjectURL(file));
                  } else {
                    setFilePreview(null);
                  }

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
              disabled={(!message.trim() && !selectedFile) || sending}
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
                  if (selectedFriend.isGroup) {
                    Firebase.clearGroupChatForMe(selectedFriend.uid);
                  } else {
                    Firebase.clearChatForMe(selectedFriend.uid);
                  }
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
      <div
        className="modal fade"
        id="groupMembersModal"
        tabIndex="-1"
        aria-labelledby="groupMembersModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-2 border-0 shadow">
            {/* Header */}
            <div className="modal-header border-0 px-4 pb-2">
              <h5 className="modal-title" id="groupMembersModalLabel">
                Group Members
              </h5>

              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body px-4 pt-2 pb-4">
              {/* Group Header */}
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: "45px",
                    height: "45px",
                    background: "#d9f5e4",
                    color: "#0d8f3d",
                    fontSize: "20px",
                  }}
                >
                  <RiGroupLine />
                </div>

                <div>
                  <h5 className="mb-1">{selectedFriend.name}</h5>
                  <small className="text-muted">
                    {groupMembersList.length} members
                  </small>
                </div>
              </div>

              {groupMembersList.map((member) => {
                const memberIsOwner = member.uid === selectedFriend.createdBy;

                return (
                  <div
                    key={member.uid}
                    className="d-flex align-items-center justify-content-between py-2"
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "40px",
                          height: "40px",
                          background: "#d9f5e4",
                          color: "#0d8f3d",
                          fontWeight: "600",
                        }}
                      >
                        {member.name?.charAt(0)?.toUpperCase()}
                      </div>

                      <div>
                        <div className="fw-semibold">
                          {member.name}
                          {memberIsOwner && (
                            <span
                              className="small ms-1"
                              style={{ color: "#0d8f3d" }}
                            >
                              ♛
                            </span>
                          )}
                        </div>
               <p className="mb-0 chat-status">
  <span
    className={`chat-status-dot ${
      onlineGroupMembers[member.uid] ? "online" : "offline"
    }`}
  />
  {onlineGroupMembers[member.uid] ? "Online" : "Offline"}
</p>
                      </div>
                    </div>

                    {/* Right side badge / button */}
                    {memberIsOwner ? (
                      <span
                        className="px-3 py-1 rounded-pill small"
                        style={{ background: "#dff6e8", color: "#0d8f3d" }}
                      >
                        Owner
                      </span>
                    ) : isOwner ? (
                      <button
                        type="button"
                        className="px-3 py-1 rounded-pill small border-0"
                        style={{
                          background: "#fdecea",
                          color: "#d93025",
                          cursor: "pointer",
                        }}
                        onClick={() => handleRemoveMember(member.uid)}
                      >
                        Remove
                      </button>
                    ) : (
                      <span
                        className="px-3 py-1 rounded-pill small"
                        style={{
                          background: "#f0f2f5",
                          color: "#6c7890",
                          cursor: "default",
                          pointerEvents: "none",
                        }}
                      >
                        Member
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Footer */}
            <div className="modal-footer border-0 px-4 pt-0">
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

      <div
        className="modal fade"
        id="groupAddMembersModal"
        tabIndex="-1"
        aria-labelledby="groupAddMembersModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-2 border-0 shadow">
            <div className="modal-header border-0">
              <h5 className="modal-title" id="groupAddMembersModalLabel">
                Add Members
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body px-3">
              <div className="d-flex align-items-center sidebar-searh-input rounded-2 gap-2 mb-3">
                <IoSearch size={16} />
                <input
                  type="text"
                  placeholder="Search friends..."
                  className="sidebar-search-input-field w-100"
                  value={addMemberSearch}
                  onChange={(e) => setAddMemberSearch(e.target.value)}
                />
              </div>

              <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                {addableFriends.length === 0 ? (
                  <p className="text-muted small text-center mb-0">
                    No friends to add
                  </p>
                ) : (
                  addableFriends.map((friend) => {
                    const isChecked = selectedNewMembers.some(
                      (m) => m.uid === friend.uid
                    );

                    return (
                      <div
                        key={friend.uid}
                        className="d-flex align-items-center justify-content-between py-2"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          const currentCount =
                            selectedFriend?.members?.length || 0;

                          if (
                            !isChecked &&
                            currentCount + selectedNewMembers.length >= 8
                          ) {
                            toast.warning(
                              "Group is already full (max 8 members)."
                            );
                            return;
                          }

                          setSelectedNewMembers((prev) =>
                            isChecked
                              ? prev.filter((m) => m.uid !== friend.uid)
                              : [...prev, friend]
                          );
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: "36px",
                              height: "36px",
                              background: "#d9f5e4",
                              color: "#0d8f3d",
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            {friend.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 500 }}>
                              {friend.name}
                            </div>
                            <small className="text-muted">{friend.email}</small>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          className="custom-checkbox"
                          checked={isChecked}
                          readOnly
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="modal-footer border-0">
              <button
                type="button"
                className="border-0 px-3 py-1 rounded-2"
                style={{ background: "#f1f1f1", color: "#555" }}
                data-bs-dismiss="modal"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!selectedNewMembers.length}
                className="border-0 px-3 py-1 text-white rounded-2"
                style={{
                  background: "#0d8f3d",
                  opacity: !selectedNewMembers.length ? 0.6 : 1,
                }}
                onClick={handleAddMembers}
              >
                Add{" "}
                {selectedNewMembers.length > 0
                  ? `(${selectedNewMembers.length})`
                  : ""}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainChatPart;
