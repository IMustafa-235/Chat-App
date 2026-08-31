import React, { useState } from "react";
import googleLogo from "./../assets/google-logo-Photoroom.png";
import { useFirebase } from "../context/Firebase";
import { FourSquare } from "react-loading-indicators";
import { FaEyeSlash, FaRegEye } from "react-icons/fa6";

const SignupLogin = () => {
  const [signUpBox, setSignUpBox] = useState(true);
  const [LoginBox, setLoginBox] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [lognEmail, setlognEmail] = useState("");
  const [lognPassword, setlognPassword] = useState("");
  const [lognPasswordShow, setlognPasswordShow] = useState(false);
  const [SignupPasswordShow, setSignupPasswordShow] = useState(false);
  const Firebase = useFirebase();

  const SignupNewUser = async (e) => {
    e.preventDefault();
    await Firebase.SignupUser(signUpEmail, signUpPassword, signUpName);
  };

  const SigninUser = async (e) => {
    e.preventDefault();
    await Firebase.SigninUser(lognEmail, lognPassword);
  };

  return (
    <div className="signup_logun px-4 px-md-0 d-flex align-items-center justify-content-center">
      <form
        className={`bg-white rounded-3 p-4 flex-column gap-4 authenticate_box ${
          signUpBox ? "d-flex" : "d-none"
        }`}
        onSubmit={SignupNewUser}
      >
        <h3 className="mb-0 text-center">Signup</h3>
        <input
          type="text"
          className="rounded-2 signup_login_inputs"
          placeholder="Enter name"
          required
          value={signUpName}
          onChange={(e) => setSignUpName(e.target.value)}
        />
        <input
          type="email"
          className="rounded-2 signup_login_inputs"
          placeholder="Enter email"
          required
          value={signUpEmail}
          onChange={(e) => setSignUpEmail(e.target.value)}
        />
        <div className="position-relative">
          <input
            type={SignupPasswordShow ? "text" : "password"}
            required
            className="rounded-2 signup_login_inputs w-100"
            placeholder="Enter password"
            value={signUpPassword}
            onChange={(e) => setSignUpPassword(e.target.value)}
          />
          {SignupPasswordShow ? (
            <FaRegEye
              className="jasfia"
              onClick={() => setSignupPasswordShow(false)}
            />
          ) : (
            <FaEyeSlash
              className="jasfia"
              onClick={() => setSignupPasswordShow(true)}
            />
          )}
        </div>
        <button
          className="py-2 border-0 rounded-2 text-white signup_login_btn"
          type="submit"
        >
          Signup
        </button>
        <div className="d-flex align-items-center gap-3">
          <div className="auth_or_line"></div>
          <p className="mb-0 text-nowrap">or continue with</p>
          <div className="auth_or_line"></div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            Firebase.SignInWithGoogle();
          }}
          className="d-flex align-items-center justify-content-center py-2 gap-3 signup_with_google rounded-2"
        >
          <img src={googleLogo} width={25} alt="" />
          Signin with Google
        </button>
        <p className="mb-0 text-center">
          Already have an account?{" "}
          <span
            style={{ color: "#349c86", cursor: "pointer" }}
            onClick={() => {
              setSignUpBox(false);
              setLoginBox(true);
            }}
          >
            Login
          </span>
        </p>
      </form>
      <form
        onSubmit={SigninUser}
        className={`bg-white rounded-3 p-4 flex-column gap-4 authenticate_box ${
          LoginBox ? "d-flex" : "d-none"
        }`}
      >
        <h3 className="mb-0 text-center">Login</h3>
        <input
          type="email"
          className="rounded-2 signup_login_inputs"
          placeholder="Enter email"
          required
          onChange={(e) => setlognEmail(e.target.value)}
          value={lognEmail}
        />
        <div className="position-relative">
          <input
            type={lognPasswordShow ? "text" : "password"}
            className="rounded-2 signup_login_inputs w-100"
            placeholder="Enter password"
            required
            value={lognPassword}
            onChange={(e) => setlognPassword(e.target.value)}
          />
          {lognPasswordShow ? (
            <FaRegEye
              className="jasfia"
              onClick={() => setlognPasswordShow(false)}
            />
          ) : (
            <FaEyeSlash
              className="jasfia"
              onClick={() => setlognPasswordShow(true)}
            />
          )}
        </div>
        <button
          type="submit"
          className="py-2 border-0 rounded-2 text-white signup_login_btn"
        >
          Login
        </button>
        <div className="d-flex align-items-center gap-3">
          <div className="auth_or_line"></div>
          <p className="mb-0 text-nowrap">or continue with</p>
          <div className="auth_or_line"></div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            Firebase.SignInWithGoogle();
          }}
          className="d-flex align-items-center justify-content-center py-2 gap-3 signup_with_google rounded-2"
        >
          <img src={googleLogo} width={25} alt="" />
          Signin with Google
        </button>
        <p className="mb-0 text-center">
          Don't have an account?{" "}
          <span
            style={{ color: "#349c86", cursor: "pointer" }}
            onClick={() => {
              setSignUpBox(true);
              setLoginBox(false);
            }}
          >
            Signup
          </span>
        </p>
      </form>
      {Firebase.loading && (
        <div className="loading-overlay">
          <FourSquare color="#32cd32" size="large" text="" textColor="" />
        </div>
      )}
    </div>
  );
};

export default SignupLogin;
