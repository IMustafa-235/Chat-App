import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useFirebase } from "../context/Firebase";
import { FourSquare } from "react-loading-indicators";

const ProtectRoute = () => {
  const { loggedIn, authLoading } = useFirebase();

  if (authLoading) {
    return (
      <div className="loading-overlay">
        <FourSquare color="#32cd32" size="large" text="" textColor="" />
      </div>
    ) 
  }
  
  return(
    loggedIn ? <Outlet /> : <Navigate to="/signup-login" replace />
    )
};

export default ProtectRoute;
