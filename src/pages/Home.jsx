import React, {useState} from "react";
import { Navigate, } from "react-router-dom";
import { useFirebase } from "../context/Firebase";
import ChatSidebar from "../components/ChatSidebar";
import MainChatPart from "../components/MainChatPart";

const Home = () => {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const { loggedIn } = useFirebase();
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
