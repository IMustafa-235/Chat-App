import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useFirebase } from "../context/Firebase";

const PublicRoute = () => {
  const { loggedIn } = useFirebase();

  return loggedIn ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoute;