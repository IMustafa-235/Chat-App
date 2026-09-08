import { createContext, useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithPopup,
  updateProfile,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  updatePassword,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  endAt,
  limit,
  getDocs,
  startAt,
  where,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  addDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import {
  getDatabase,
  onDisconnect,
  ref,
  set,
  onValue,
  update,
} from "firebase/database";
import { toast } from "react-toastify";
import { data, useNavigate } from "react-router-dom";

export const FirebaseContext = createContext();
const firebaseConfig = {
  apiKey: "AIzaSyC6U7shPN2sHs6BaKUeAgVXEtqumFTau4Q",
  authDomain: "chat-app-45717.firebaseapp.com",
  databaseURL: "https://chat-app-45717-default-rtdb.firebaseio.com",
  projectId: "chat-app-45717",
  storageBucket: "chat-app-45717.firebasestorage.app",
  messagingSenderId: "610102045047",
  appId: "1:610102045047:web:fa1b9cd7a1118c146d1972",
};

export const useFirebase = () => useContext(FirebaseContext);
const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const database = getDatabase(firebaseApp);

const FirebaseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [loading, setloading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const SignupUser = async (signUpEmail, signUpPassword, signUpName) => {
    setloading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        signUpEmail,
        signUpPassword
      );

      await updateProfile(userCredential.user, {
        displayName: signUpName,
      });
      await setDoc(doc(firestore, "users", userCredential.user.uid), {
        name: signUpName,
        email: signUpEmail,
        emailLower: signUpEmail.toLowerCase().trim(),
        uid: userCredential.user.uid,
        createdAt: new Date().toISOString(),
      });
      navigate("/");
      setloading(false);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.warning("This email is already taken");
      } else if (error.code === "auth/weak-password") {
        toast.error("Please make password strong");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address.");
      } else {
        toast.error(error.message);
      }
      setloading(false);
    } finally {
      setloading(false);
    }
  };
  const SigninUser = async (loginEmail, loginPassword) => {
    setloading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        loginEmail,
        loginPassword
      );

      navigate("/");
      setloading(false);
      return userCredential;
    } catch (error) {
      if (error.code === "auth/invalid-credential") {
        toast.error("Invalid email or password.");
      } else if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address.");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many failed attempts. Please try again later.");
      } else {
        toast.error(error.message);
      }
      setloading(false);
    } finally {
      setloading(false);
    }
  };
  const SignInWithGoogle = async () => {
    setloading(true);
    try {
      const googleProvider = new GoogleAuthProvider();

      const result = await signInWithPopup(firebaseAuth, googleProvider);

      await setDoc(
        doc(firestore, "users", result.user.uid),
        {
          name: result.user.displayName,
          email: result.user.email,
          emailLower: result.user.email.toLowerCase().trim(),
          uid: result.user.uid,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      navigate("/");
      setloading(false);
      return result;
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        toast.warning("Google sign-in was cancelled.");
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Popup was blocked. Please allow popups and try again.");
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        toast.error(
          "An account already exists with a different sign-in method."
        );
      } else if (error.code === "auth/network-request-failed") {
        toast.error("Network error. Please check your internet connection.");
      } else {
        toast.error(error.message);
      }
      setloading(false);
    } finally {
      setloading(false);
    }
  };

  const userLogout = async () => {
    try {
      if (user) {
        const userStatusRef = ref(database, `status/${user.uid}`);

        const activeChatRef = ref(database, `activeChats/${user.uid}`);

        await set(userStatusRef, {
          state: "offline",
        });

        await set(activeChatRef, null);
      }

      await signOut(firebaseAuth);

      navigate("/signup-login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout.");
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setUser(user);
      if (user) {
        const data = await getDoc(doc(firestore, "users", user.uid));

        if (data.exists()) {
          setUserData(data.data());
        }
      } else {
        setUserData(null);
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const userStatusRef = ref(database, `status/${user.uid}`);

    const setupStatus = async () => {
      await onDisconnect(userStatusRef).set({
        state: "offline",
      });

      await set(userStatusRef, {
        state: "online",
      });
    };

    setupStatus();
  }, [user]);

  const listenUserStatus = (friendId, callback) => {
    const friendStatusRef = ref(database, `status/${friendId}`);

    const unsubscribe = onValue(friendStatusRef, (snapshot) => {
      callback(snapshot.val());
    });

    return unsubscribe;
  };

  const setTyping = async (friendId, isTyping) => {
    if (!user?.uid || !friendId) {
      console.log("❌ setTyping missing:", {
        user: user?.uid,
        friendId,
      });
      return;
    }
  
    try {
      const path = `typing/${user.uid}/${friendId}`;
  
      console.log("✍️ SET TYPING:", path, isTyping);
  
      const typingRef = ref(database, path);
  
      if (isTyping) {
        await onDisconnect(typingRef).set(false);
      }
  
      await set(typingRef, isTyping);
  
      console.log("✅ TYPING SET:", path, isTyping);
    } catch (error) {
      console.error("❌ setTyping error:", error);
    }
  };
  
    
  const listenTyping = (friendId, callback) => {
    if (!user?.uid || !friendId) {
      console.log("❌ listenTyping: missing user/friendId", {
        user: user?.uid,
        friendId,
      });
      return () => {};
    }
  
    const typingRef = ref(
      database,
      `typing/${friendId}/${user.uid}`
    );
  
    console.log("👂 Listening typing:", `typing/${friendId}/${user.uid}`);
  
    const unsubscribe = onValue(
      typingRef,
      (snapshot) => {
        console.log("🔥 TYPING VALUE:", snapshot.val());
  
        callback(snapshot.val() === true);
      },
      (error) => {
        console.error("❌ Typing listener error:", error);
      }
    );
  
    return unsubscribe;
  };
  
  

  const updateUserName = async (newName) => {
    try {
      setloading(true);
      if (!user) return;
      await updateDoc(doc(firestore, "users", user.uid), {
        name: newName,
      });

      await updateProfile(user, {
        displayName: newName,
      });
      setUserData((prev) => ({
        ...prev,
        name: newName,
      }));

      toast.success("Name updated succesfully");
    } catch (error) {
      toast.error(error);
    } finally {
      setloading(false);
    }
  };

  const changePassword = async (
    currentPassword,
    newPassword,
    confirmPassword
  ) => {
    setloading(true);

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.warning("Please fill in all fields.");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }

      if (newPassword.length < 6) {
        toast.warning("Password must be at least 6 characters.");
        return;
      }

      if (currentPassword === newPassword) {
        toast.warning(
          "New password cannot be the same as the current password."
        );
        return;
      }

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      toast.success("Password updated successfully.");
    } catch (error) {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        toast.error("Current password is incorrect.");
      } else if (error.code === "auth/network-request-failed") {
        toast.error("Network error. Please check your internet connection.");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.");
      } else if (error.code === "auth/user-disabled") {
        toast.error("This account has been disabled.");
      } else if (error.code === "auth/user-not-found") {
        toast.error("User account not found.");
      } else if (error.code === "auth/requires-recent-login") {
        toast.error("Please log in again before changing your password.");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password is too weak. Use at least 6 characters.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address.");
      } else if (error.code === "auth/internal-error") {
        toast.error("Firebase internal error. Please try again.");
      } else if (error.code === "auth/operation-not-allowed") {
        toast.error("This operation is not allowed.");
      } else {
        toast.error(error.message || "Failed to change password.");
      }
    } finally {
      setloading(false);
    }
  };

  const addSearchUser = async (text) => {
    try {
      const searchText = text.toLowerCase().trim();
      if (searchText.length < 2) {
        return [];
      }
      const users = collection(firestore, "users");

      const addSearchQuery = query(
        users,
        orderBy("emailLower"),
        startAt(searchText),
        endAt(searchText + "\uf8ff"),
        limit(6)
      );
      const jafs = await getDocs(addSearchQuery);

      return jafs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      return [];
    }
  };

  const sendFreindReq = async (receiver) => {
    try {
      const senderId = user.uid;
      const receiverId = receiver.uid;
      const currentUserSnap = await getDoc(doc(firestore, "users", senderId));

      const currentUserData = currentUserSnap.data();

      if (currentUserData?.friends?.includes(receiverId)) {
        toast.info("You are already friends with this user.");
        return;
      }

      const myRequestId = `${senderId}_${receiverId}`;

      const myRequestSnap = await getDoc(
        doc(firestore, "freindRequests", myRequestId)
      );

      if (myRequestSnap.exists() && myRequestSnap.data().status === "pending") {
        toast.warning("Request already sent.");
        return;
      }

      const reverseRequestId = `${receiverId}_${senderId}`;

      const reverseRequestSnap = await getDoc(
        doc(firestore, "freindRequests", reverseRequestId)
      );

      if (
        reverseRequestSnap.exists() &&
        reverseRequestSnap.data().status === "pending"
      ) {
        toast.info("This user has already sent you a request.");
        return;
      }

      await setDoc(doc(firestore, "freindRequests", myRequestId), {
        from: senderId,
        to: receiverId,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      toast.success("Request sent!");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      throw error;
    }
  };

  const listenFriendRequests = (freindreq) => {
    const requestRef = collection(firestore, "freindRequests");

    const friendReqQuery = query(
      requestRef,
      where("to", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(friendReqQuery, async (firee) => {
      const requests = firee.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          const sender = await getUserById(request.from);
          return {
            ...request,
            sender,
          };
        })
      );

      freindreq(requestsWithUsers);
    });

    return unsubscribe;
  };

  const getUserById = async (uid) => {
    try {
      const userRef = doc(firestore, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return {
          uid: userSnap.id,
          ...userSnap.data(),
        };
      }

      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const acceptFriendRequest = async (request) => {
    try {
      if (!user) return;

      const senderId = request.from;
      const receiverId = user.uid;

      await updateDoc(doc(firestore, "freindRequests", request.id), {
        status: "accepted",
      });

      await setDoc(
        doc(firestore, "users", receiverId),
        {
          friends: arrayUnion(senderId),
        },
        { merge: true }
      );

      await setDoc(
        doc(firestore, "users", senderId),
        {
          friends: arrayUnion(receiverId),
        },
        { merge: true }
      );

      const chatid = [senderId, receiverId].sort().join("_");
      await setDoc(
        doc(firestore, "chats", chatid),
        {
          chatid: chatid,
          participants: [senderId, receiverId],
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastMessageTime: null,
          unreadCounts: {
            [senderId]: 0,
            [receiverId]: 0,
          },
        },
        { merge: true }
      );

      toast.success("Friend request accepted!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to accept request");
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      await deleteDoc(doc(firestore, "freindRequests", requestId));

      toast.success("Request rejected");
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject request");
    }
  };
  const listenFreinds = (setFriends) => {
    if (!user) {
      setFriends([]);
      return () => {};
    }

    const userRef = doc(firestore, "users", user.uid);

    let chatUnsubscribes = [];
    let friendsById = new Map();

    const updateFriendsState = () => {
      const friends = Array.from(friendsById.values());

      friends.sort((a, b) => {
        const timeA =
          a.lastMessageTime?.toMillis?.() || a.friendedAt?.toMillis?.() || 0;
        const timeB =
          b.lastMessageTime?.toMillis?.() || b.friendedAt?.toMillis?.() || 0;

        return timeB - timeA;
      });

      setFriends(friends);
    };

    const unsubscribeUser = onSnapshot(
      userRef,
      async (userSnap) => {
        if (!userSnap.exists()) {
          friendsById.clear();
          setFriends([]);
          return;
        }

        const userData = userSnap.data();
        const friendIds = userData.friends || [];

        // Remove previous chat listeners
        chatUnsubscribes.forEach((unsubscribe) => unsubscribe());
        chatUnsubscribes = [];

        // Remove friends that are no longer friends
        friendsById = new Map();

        // Load friend profiles
        const friendsData = await Promise.all(
          friendIds.map(async (friendId) => {
            const friend = await getUserById(friendId);

            if (!friend) return null;

            return friend;
          })
        );

        const validFriends = friendsData.filter(Boolean);

        // IMPORTANT:
        // Do NOT initialize unreadCount from 0 as a source of truth.
        // The chat document owns unreadCounts.
        validFriends.forEach((friend) => {
          friendsById.set(friend.uid, {
            ...friend,
            lastMessage: "",
            lastMessageTime: null,
            lastMessageSenderId: null,
            unreadCount: 0,
          });
        });

        updateFriendsState();

        // Listen to each chat document
        validFriends.forEach((friend) => {
          const chatId = [user.uid, friend.uid].sort().join("_");

          const chatRef = doc(firestore, "chats", chatId);

          const unsubscribeChat = onSnapshot(chatRef, (chatSnap) => {
            if (!chatSnap.exists()) {
              return;
            }

            const chatData = chatSnap.data();

            const unreadCount = chatData.unreadCounts?.[user.uid] || 0;

            const existingFriend = friendsById.get(friend.uid);

            if (!existingFriend) {
              return;
            }

            friendsById.set(friend.uid, {
              ...existingFriend,

              lastMessage: chatData.lastMessage || "",

              lastMessageTime: chatData.lastMessageTime || null,

              lastMessageSenderId: chatData.lastMessageSenderId || null,
              friendedAt: chatData.createdAt || null,

              // ONLY Firestore chat data controls unreadCount\
              unreadCount,
            });
            updateFriendsState();
          });

          chatUnsubscribes.push(unsubscribeChat);
        });
      },
      (error) => {
        console.error("listenFreinds error:", error);
      }
    );

    return () => {
      unsubscribeUser();

      chatUnsubscribes.forEach((unsubscribe) => unsubscribe());

      chatUnsubscribes = [];
      friendsById.clear();
    };
  };

  const sendMessage = async (receiverId, text, imageFile = null, replyTo = null) => {
    try {
      if (!user || !receiverId || (!text?.trim() && !imageFile)) {
        return;
      }
      const senderId = user.uid;

      const chatId = [senderId, receiverId].sort().join("_");

      const chatRef = doc(firestore, "chats", chatId);

      const messagesRef = collection(firestore, "chats", chatId, "messages");

      let imageUrl = null;
      let imagePublicId = null;
      if (imageFile) {
        const uploadResult = await uploadImageToCloudinary(imageFile);
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.publicId;
      }

      const messageText = text.trim();

      // --------------------------------------------------
      // 1. Save message
      // --------------------------------------------------

      await addDoc(messagesRef, {
        text: messageText,
        imageUrl: imageUrl || null,
        senderId,
        receiverId,
        createdAt: serverTimestamp(),
        imagePublicId: imagePublicId || null,
        seen: false,
        edited: false,
          replyTo: replyTo
    ? {
        id: replyTo.id,
        text: replyTo.text || "",
        imageUrl: replyTo.imageUrl || null,
        senderId: replyTo.senderId,
      }
    : null,
      });

      // --------------------------------------------------
      // 2. Check whether receiver is currently viewing
      //    THIS exact chat
      // --------------------------------------------------

      const receiverActiveChatRef = ref(database, `activeChats/${receiverId}`);

      const receiverActiveChatSnapshot = await new Promise((resolve) => {
        onValue(receiverActiveChatRef, resolve, {
          onlyOnce: true,
        });
      });

      const receiverActiveChat = receiverActiveChatSnapshot.val();

      const receiverIsInThisChat = receiverActiveChat === senderId;

      // --------------------------------------------------
      // 3. Update chat
      // --------------------------------------------------

      await setDoc(
        chatRef,
        {
          chatid: chatId,
          participants: [senderId, receiverId],
          lastMessage: messageText || "Photo",
          lastMessageTime: serverTimestamp(),
          lastMessageSenderId: senderId,
          lastMessageId: chatRef.id,
        },
        { merge: true }
      );

      if (!receiverIsInThisChat) {
        await updateDoc(chatRef, {
          [`unreadCounts.${receiverId}`]: increment(1),
        });
      }
    } catch (error) {
      console.error("sendMessage error:", error);

      toast.error("Something went wrong while sending the message.");
    }
  };

  const listenMessages = (friendId, callback) => {
    if (!user || !friendId) return;

    const chatId = [user.uid, friendId].sort().join("_");

    const messagesRef = collection(firestore, "chats", chatId, "messages");

    const messagesQuery = query(messagesRef, orderBy("createdAt"));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map((messageDoc) => ({
        id: messageDoc.id,
        ...messageDoc.data(),
      }));
      callback(messages);
    });
    return unsubscribe;
  };

  const markAsRead = async (friendId) => {
    try {
      if (!user || !friendId) {
        return;
      }

      const currentUserId = user.uid;

      const chatId = [currentUserId, friendId].sort().join("_");

      const chatRef = doc(firestore, "chats", chatId);

      await setDoc(
        chatRef,
        {
          unreadCounts: {
            [currentUserId]: 0,
          },
        },
        { merge: true }
      );
    } catch (error) {
      console.error("markAsRead error:", error);

      toast.error("Failed to mark messages as read.");
    }
  };

  const setActiveChat = async (friendId) => {
    if (!user) return;

    const activeChatRef = ref(database, `activeChats/${user.uid}`);

    try {
      // Always register disconnect cleanup first.
      const disconnectRef = onDisconnect(activeChatRef);

      await disconnectRef.set(null);

      if (friendId) {
        await set(activeChatRef, friendId);
      } else {
        await set(activeChatRef, null);
      }
    } catch (error) {
      console.error("setActiveChat error:", error);
    }
  };

  const deleteMessage = async (friendId, messageId) => {
    try {
      if (!user || !friendId || !messageId) return;

      const chatId = [user.uid, friendId].sort().join("_");

      const messageRef = doc(firestore, "chats", chatId, "messages", messageId);

      // ✅ Delete karne se pehle uska data padho, imagePublicId chahiye
      const messageSnap = await getDoc(messageRef);
      const messageData = messageSnap.exists() ? messageSnap.data() : null;

      await deleteDoc(messageRef);

      // ✅ Agar image thi, Cloudinary se bhi delete karo
      if (messageData?.imagePublicId) {
        await deleteImageFromCloudinary(messageData.imagePublicId);
      }

      const messagesRef = collection(firestore, "chats", chatId, "messages");

      const latestMessageQuery = query(
        messagesRef,
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const latestMessageSnapshot = await getDocs(latestMessageQuery);

      const chatRef = doc(firestore, "chats", chatId);

      if (!latestMessageSnapshot.empty) {
        const latestMessageDoc = latestMessageSnapshot.docs[0];
        const latestMessage = latestMessageDoc.data();

        await updateDoc(chatRef, {
          lastMessage: latestMessage.text || "",
          lastMessageTime: latestMessage.createdAt || null,
          lastMessageSenderId: latestMessage.senderId || "",
        });
      } else {
        await updateDoc(chatRef, {
          lastMessage: "",
          lastMessageTime: null,
          lastMessageSenderId: "",
        });
      }
    } catch (error) {
      console.error("deleteMessage error:", error);
      toast.error(error.message || "Failed to delete message.");
    }
  };

  const editMessage = async (
    friendId,
    messageId,
    newMessage,
    newImage = null,
    removeImage = false
  ) => {
    try {
      if (!user || !friendId || !messageId) {
        return;
      }

      const messageText = newMessage?.trim() || "";

      // Agar text aur image dono nahi hain
      if (!messageText && !newImage && !removeImage) {
        toast.warning("Message cannot be empty.");
        return;
      }

      const chatId = [user.uid, friendId].sort().join("_");

      const messageRef = doc(firestore, "chats", chatId, "messages", messageId);

      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) {
        toast.error("Message not found");
        return;
      }

      const oldMessage = messageSnap.data();

      const updateData = {
        text: messageText,
        edited: true,
        editedAt: serverTimestamp(),
      };
      // Agar new image select ki hai
      if (newImage) {
        const uploadResult = await uploadImageToCloudinary(newImage);
        updateData.imageUrl = uploadResult.url;
        updateData.imagePublicId = uploadResult.publicId;

        if (oldMessage.imagePublicId) {
          await deleteImageFromCloudinary(oldMessage.imagePublicId);
        }
      }

      // Agar image remove karni hai
      else if (removeImage) {
        updateData.imageUrl = null;
        updateData.imagePublicId = null;

        if (oldMessage.imagePublicId) {
          await deleteImageFromCloudinary(oldMessage.imagePublicId);
        }
      }

      await updateDoc(messageRef, updateData);

      // ------------------------------------
      // Update last message in chat
      // ------------------------------------

      const chatRef = doc(firestore, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      if (chatSnap.exists()) {
        const chatData = chatSnap.data();

        if (chatData.lastMessageId === messageId) {
          await updateDoc(chatRef, {
            lastMessage: messageText || (newImage ? "Photo" : ""),
            lastMessageTime: serverTimestamp(),
            lastMessageSenderId: user.uid,
          });
        }
      }
    } catch (error) {
      console.error("Edit message error:", error);
      toast.error(error.message || "Failed to edit message");
    }
  };

  const uploadImageToCloudinary = async (file) => {
    const CLOUD_NAME = "blpnn3tw";
    const UPLOAD_PRESET = "chatify";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    return { url: data.secure_url, publicId: data.public_id };
  };

  const deleteImageFromCloudinary = async (publicId) => {
    if (!publicId) {
      console.log("No publicId provided");
      return;
    }
  
    console.log("Deleting Cloudinary publicId:", publicId);
  
    try {
      const res = await fetch(
        "http://localhost:5001/chat-app-45717/us-central1/deleteImage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            publicId,
          }),
        }
      );
  
      const data = await res.json();
  
      console.log("Firebase Function response:", data);
  
      if (!res.ok) {
        throw new Error(data.error || "Cloudinary delete failed");
      }
  
      if (data.success) {
        console.log("Cloudinary image deleted:", data);
        return data;
      }
  
      throw new Error(data.error || "Image deletion failed");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(`Delete failed: ${error.message}`);
      throw error;
    }
  };
  
  
  
  
  
  

  const loggedIn = user !== null;
  return (
    <FirebaseContext.Provider
      value={{
        user,
        loggedIn,
        SignupUser,
        SignInWithGoogle,
        SigninUser,
        userLogout,
        loading,
        authLoading,
        updateUserName,
        userData,
        setloading,
        changePassword,
        addSearchUser,
        sendFreindReq,
        listenFriendRequests,
        getUserById,
        acceptFriendRequest,
        rejectFriendRequest,
        listenFreinds,
        listenMessages,
        sendMessage,
        listenUserStatus,
        markAsRead,
        setActiveChat,
        deleteMessage,
        editMessage,
        setTyping,
        listenTyping,
        deleteImageFromCloudinary,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export default FirebaseProvider;
