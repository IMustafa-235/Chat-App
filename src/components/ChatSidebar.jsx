import React, { useEffect } from "react";
import { IoChatbubbleEllipsesSharp, IoMailOpen } from "react-icons/io5";
import { MdOutlineSettings } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { useFirebase } from "../context/Firebase";
import { Link } from "react-router-dom";
import { GoPersonAdd } from "react-icons/go";
import { useState } from "react";

const ChatSidebar = ({ setSelectedFriend, selectedFriend }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [conSearch, setConSearch] = useState("");
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const Firebase = useFirebase();

  const searchingUsers = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim().length < 1) {
      setResults([]);
      return;
    }
    const users = await Firebase.addSearchUser(value);
    const filteredUsers = users.filter(
      (user) => user.uid !== Firebase.user.uid
    );

    setResults(filteredUsers);
  };
  useEffect(() => {
    const unsubscribeRequests = Firebase.listenFriendRequests((data) => {
      setRequests(data);
    });

    const unsubscribeFriends = Firebase.listenFreinds((data) => {
      setFriends(data);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeFriends();
    };
  }, [Firebase.user]);

  useEffect(() => {
    const totalUnreadMessages = friends.reduce(
      (sum, friend) => sum + (friend.unreadCount || 0),
      0
    );

    const totalPending = totalUnreadMessages + requests.length;

    if (totalPending > 0) {
      document.title = `(${totalPending}) Chatify`;
    } else {
      document.title = "Chatify";
    }

    return () => {
      document.title = "Chatify";
    };
  }, [friends, requests]);

  const conSearchFilters = friends.filter((freind) =>
    freind.name.toLowerCase().includes(conSearch.toLowerCase().trim())
  );
  useEffect(() => {
    if (!Firebase.user || !friends.length) return;

    const unsubscribes = friends.map((friend) => {
      return Firebase.listenTyping(friend.uid, (isTyping) => {
        setTypingUsers((prev) => ({
          ...prev,
          [friend.uid]: isTyping,
        }));
      });
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [friends.map((friend) => friend.uid).join(","), Firebase.user?.uid]);

  return (
    <div className="chat-sidebar py-4">
      <div className="d-flex justify-content-center flex-column">
        <div className="d-flex align-items-center gap-2 px-4">
          <IoChatbubbleEllipsesSharp size={32} color="#1c9641" />
          <h4 className="mb-0">Chatify</h4>
        </div>

        <div className="px-4">
          <div
            className="rounded-2 mt-5 w-100 py-2 add-chat-btn d-flex align-items-center justify-content-center gap-2"
            style={{ cursor: "pointer" }}
            data-bs-toggle="modal"
            data-bs-target="#exampleModal"
          >
            <GoPersonAdd style={{ strokeWidth: 1 }} size={20} />
            Add peoples
          </div>
          <div
            className="rounded-2 mt-4 w-100 py-2 add-chat-btn d-flex align-items-center justify-content-center gap-2 position-relative"
            data-bs-toggle="modal"
            data-bs-target="#requestsModal"
            style={{
              cursor: "pointer",
              background: "#d8f3e2",
              color: "#1c9641",
            }}
          >
            <IoMailOpen style={{ strokeWidth: 1 }} size={20} />
            Requests
            <div
              className={`aojfsm align-items-center justify-content-center ${
                requests.length === 0 ? "d-none" : "d-flex"
              }`}
            >
              {requests.length}
            </div>
          </div>
          <div className="d-flex align-items-center sidebar-searh-input my-4 rounded-2 gap-2">
            <FiSearch />
            <input
              type="text"
              placeholder="Search conversations"
              className="sidebar-search-input-field w-100"
              value={conSearch}
              onChange={(e) => setConSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="d-flex flex-column gap-1 justify-content-start align-items-start user-sidebar-parent px-4 pb-3">
          {conSearchFilters.map((friend) => {
            return (
              <div
                onClick={() => setSelectedFriend(friend)}
                key={friend.uid}
                className={`d-flex align-items-center justify-content-between w-100 p-2 user-outside rounded-2 ${
                  selectedFriend?.uid === friend.uid ? "active-chat-user" : ""
                }`}
              >
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      padding: "6px 14px",
                      background: "#D8F3E2     ",
                      color: "#1c9641",
                    }}
                    className="d-flex fw-semibold align-items-center justify-content-center rounded-circle"
                  >
                    {friend.name?.trim().split(" ")[0]?.charAt(0).toUpperCase()}
                  </div>
                  <div className="d-flex flex-column gap-1 justify-content-center">
                    <h6 className="mb-0" style={{ fontSize: "15.5px" }}>
                      {friend.name.charAt(0).toUpperCase() +
                        friend.name.slice(1)}
                    </h6>



                    <p
                      className="friend-last-message mb-0 text-truncate"
                      style={{
                        fontSize: "12.5px",
                        width: "140px",
                        color: typingUsers[friend.uid] ? "#1c9641" : undefined,
                        fontWeight: typingUsers[friend.uid] ? "500" : undefined,
                      }}
                    >
                      {typingUsers[friend.uid] ? (
                        `${friend.name} is typing...`
                      ) : friend.lastMessage ? (
                        friend.lastMessage ===
                        "This message was deleted" ? (
                          <em className="deleted-message">
                            You: This message was deleted
                          </em>
                        
                        
                        ) : friend.lastMessageSenderId ===
                          Firebase.user?.uid ? (
                          `You: ${friend.lastMessage}`
                        ) : (
                          friend.lastMessage
                        )
                      ) : (
                        "No messages yet"
                      )}
                    </p>


                  </div>
                </div>
                <div className="d-flex gap-1 flex-column">
                  <p className="mb-0" style={{ fontSize: "13px" }}>
                    {friend.lastMessageTime
                      ? friend.lastMessageTime.toDate().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>

                  {friend.unreadCount > 0 && (
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle text-white align-self-end"
                      style={{
                        background: "#1c9641",
                        minWidth: "21px",
                        height: "21px",
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "0 5px",
                      }}
                    >
                      <span style={{ paddingTop: "4px" }}>
                        {friend.unreadCount > 99 ? "99+" : friend.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="d-flex align-items-center justify-content-between px-3"
          style={{ paddingTop: "10px", fontSize: "15px" }}
        >
          <Link to={"/profile"} className="text-decoration-none text-black">
            <div className=" d-flex align-items-center gap-2">
              Settings <MdOutlineSettings />
            </div>
          </Link>
        </div>

        <div
          className="modal fade"
          id="exampleModal"
          tabIndex="-1"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-2">
              <div className="modal-header align-items-start border-0">
                <h5 className="modal-title" id="exampleModalLabel">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center p-2 rounded-1"
                      style={{ background: "#edfbf2" }}
                    >
                      <GoPersonAdd
                        style={{ strokeWidth: 0.5 }}
                        color="#117f35"
                        size={30}
                      />
                    </div>
                    <div>
                      <h6 className="mb-0 mb-1" style={{ fontSize: "18px" }}>
                        Add People
                      </h6>
                      <p
                        className="mb-0"
                        style={{ fontSize: "13px", color: "#606471" }}
                      >
                        Search and add people to start chatting
                      </p>
                    </div>
                  </div>
                </h5>

                <button
                  type="button"
                  className="btn-close pt-3"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="px-3 mt-2">
                <div className="d-flex align-items-center sidebar-searh-input rounded-2 gap-2">
                  <FiSearch />
                  <input
                    value={search}
                    onChange={searchingUsers}
                    type="email"
                    placeholder="Search by email..."
                    className="sidebar-search-input-field w-100"
                  />
                </div>
              </div>
              <div className="modal-body mt-2">
                <span
                  className={results.length < 1 ? "d-none" : "d-block"}
                  style={{ fontWeight: "450" }}
                >
                  Suggested People
                </span>
                <div className="searched-ppls d-flex flex-column rounded-3 mt-3">
                  {results.map((user) => {
                    return (
                      <div
                        key={user.uid}
                        className="d-flex justify-content-between align-items-center searched-ppl rounded-3"
                      >
                        <div className="d-flex gap-3 align-items-center">
                          <div
                            className="d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                              background: "#eaf8ef",
                              color: "#1c9641",
                              padding: "8px 14px",
                              fontWeight: "500",
                            }}
                          >
                            <p className="mb-0" style={{ fontSize: "18px" }}>
                              {user.name
                                ?.trim()
                                .split(" ")[0]
                                ?.charAt(0)
                                .toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <h6 className="mb-0 mb-1">{user.name}</h6>
                            <p className="mb-0" style={{ fontSize: "13px" }}>
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <button
                          disabled={loadingUserId === user.uid}
                          onClick={async () => {
                            try {
                              setLoadingUserId(user.uid);

                              await Firebase.sendFreindReq(user);
                            } catch (error) {
                              console.log(error);
                            } finally {
                              setLoadingUserId(null);
                            }
                          }}
                          style={{
                            fontSize: "14px",
                            padding: "5px 10px",
                            background: "#0d8f3d",
                            opacity: loadingUserId === user.uid ? 0.6 : 1,
                            cursor:
                              loadingUserId === user.uid
                                ? "not-allowed"
                                : "pointer",
                          }}
                          className="border-0 gap-2 text-white rounded-2 d-flex align-items-center justify-content-center"
                        >
                          <GoPersonAdd style={{ strokeWidth: 0.5 }} size={20} />

                          {loadingUserId === user.uid ? "Sending..." : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-body mt-2">
                {results.length > 0 ? (
                  <div></div>
                ) : (
                  <div>
                    <h5 className="text-center mb-0">No search yet</h5>
                  </div>
                )}
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
          id="requestsModal"
          tabIndex="-1"
          aria-labelledby="requestsModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-2">
              <div className="modal-header border-0">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center p-2 rounded-1"
                    style={{ background: "#edfbf2" }}
                  >
                    <IoMailOpen color="#117f35" size={28} />
                  </div>

                  <div>
                    <h5 className="mb-1" id="requestsModalLabel">
                      Requests
                    </h5>
                    <p
                      className="mb-0"
                      style={{ fontSize: "13px", color: "#606471" }}
                    >
                      Manage your chat requests
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body">
                {requests.length === 0 ? (
                  <h6 className="text-center text-muted py-4">
                    No requests yet
                  </h6>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      className="d-flex align-items-center justify-content-between p-2 rounded-3"
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            background: "#eaf8ef",
                            color: "#1c9641",
                            width: "45px",
                            height: "45px",
                            fontWeight: "500",
                          }}
                        >
                          {request.sender?.name
                            ?.split(" ")
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div>
                          <h6 className="mb-1">{request.sender?.name}</h6>

                          <p
                            className="mb-0 text-truncate jsafpoaf"
                            style={{
                              fontSize: "13px",
                              color: "#606471",
                            }}
                          >
                            {request.sender?.email}
                          </p>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          onClick={async () => {
                            await Firebase.acceptFriendRequest(request);
                            setRequests((prev) =>
                              prev.filter((item) => item.id !== request.id)
                            );
                          }}
                          className="border-0 text-white rounded-2 px-3 py-1"
                          style={{ background: "#0d8f3d" }}
                        >
                          Accept
                        </button>

                        <button
                          onClick={async () => {
                            await Firebase.rejectFriendRequest(request.id);
                            setRequests((prev) =>
                              prev.filter((item) => item.id !== request.id)
                            );
                          }}
                          className="border-0 rounded-2 px-3 py-1"
                          style={{
                            background: "#f1f1f1",
                            color: "#555",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
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
    </div>
  );
};

export default ChatSidebar;
