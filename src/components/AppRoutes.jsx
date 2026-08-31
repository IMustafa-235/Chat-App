import React from "react";
import { Routes, Route } from "react-router-dom";
import SignupLogin from "../pages/SignupLogin";
import Home from "../pages/Home";
import ProtectRoute from "./ProtectRoute";
import PublicRoute from "./PublicRoute";
import Profile from "../pages/Profile";

const AppRoutes = () => {
  return (
    <div>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/signup-login" element={<SignupLogin />} />
        </Route>
        
        <Route element={<ProtectRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </div>
  );
};

export default AppRoutes;
