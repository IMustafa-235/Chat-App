import React, {useState, useEffect} from "react";
import { Navigate, } from "react-router-dom";
import { useFirebase } from "../context/Firebase";
import ChatSidebar from "../components/ChatSidebar";
import MainChatPart from "../components/MainChatPart";

const Home = () => {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const Firebase = useFirebase();
  const { loggedIn, user } = Firebase;
  useEffect(() => {
    if (!user) return;

    const unsubscribe = Firebase.listenGroups((groups) => {
      setSelectedFriend((prev) => {
        if (!prev?.isGroup) return prev;

        const updated = groups.find((g) => g.uid === prev.uid);

        if (!updated) return null;

        return updated;
      });
    });

    return () => unsubscribe?.();
  }, [user]);
  if (!loggedIn) {
    return <Navigate to="/signup-login" replace />;
  }


  return (
    <div className="pt-3">
      <div className="container d-flex chat-container p-0">
        <ChatSidebar selectedFriend={selectedFriend}
          setSelectedFriend={setSelectedFriend} />
        <MainChatPart selectedFriend={selectedFriend}/>
      </div>
    </div>
  );
};

export default Home;
