import React, { useEffect, useState } from "react";
import { GoArrowLeft } from "react-icons/go";
import { MdKeyboardArrowRight } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import { RxDotsHorizontal } from "react-icons/rx";
import { Link } from "react-router-dom";
import { FourSquare } from "react-loading-indicators";
import { useFirebase } from "../context/Firebase";
import { FaEyeSlash, FaRegEye } from "react-icons/fa6";

const Profile = () => {
  const Firebase = useFirebase();
  const [name, setName] = useState(false);
  const [password, setPassword] = useState(false);
  const [userNmae, setUserNmae] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassowrd] = useState("");
  const [confirmPasswordShow, setConfirmPasswordShow] = useState(false);
  const [newPasswordShow, setNewPasswordShow] = useState(false);
  const [currentPasswordShow, setCurrentPasswordShow] = useState(false);

  const EmailPassUser =
    Firebase.user?.providerData?.some(
      (provider) => provider.providerId === "password"
    ) || false;

  useEffect(() => {
    if (Firebase.userData) {
      setUserNmae(Firebase.userData.name);
    }
  }, [Firebase.userData]);

  const updateName = async () => {
    await Firebase.updateUserName(userNmae);
    setName(false);
  };

  const changingPass = async () => {
    await Firebase.changePassword(
      currentPassword,
      newPassword,
      confirmPassword
    );
  };

  return (
    <div className="p-4 d-flex justify-content-center">
      {Firebase.loading && (
        <div className="loading-overlay">
          <FourSquare color="#32cd32" size="large" text="" textColor="" />
        </div>
      )}
      <div className="d-flex flex-column afnca">
        <div className="d-flex align-items-start justify-content-between">
          <div>
            <h4 style={{ color: "#333333" }}>Account Settings</h4>
            <p className="mb-0" style={{ fontSize: "14px", color: "#6a7282" }}>
              Manage your personal details, security settings and preferences.
            </p>
          </div>
          <Link
            className="text-decoration-none"
            style={{ color: "#333333" }}
            to={"/"}
          >
            <div
              className="d-flex align-items-center gap-2 pt-2"
              style={{ fontSize: "15px", cursor: "pointer" }}
            >
              <GoArrowLeft size={20} />
              Back
            </div>
          </Link>
        </div>

        <div className="mt-4 mb-3 shadow-sm rounded-3 bg-white p-4 card">
          <div
            className="d-flex align-items-start justify-content-between"
            style={{ cursor: "pointer" }}
            onClick={() => setName(!name)}
          >
            <div>
              <p
                className="mb-0"
                style={{
                  color: "#99a1af",
                  fontWeight: "450",
                  fontSize: "13px",
                }}
              >
                NAME
              </p>

              <h5 className="mb-0 mt-2" style={{ color: "#333333" }}>
                {Firebase.userData?.name || ""}
              </h5>
            </div>

            <motion.div
              animate={{ rotate: name ? 90 : 0 }}
              transition={{ duration: 0.3 }}
              className="pt-2"
            >
              <MdKeyboardArrowRight size={23} color="#333333" />
            </motion.div>
          </div>
          <AnimatePresence initial={false}>
            {name && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: 0.25,
                  ease: "easeInOut",
                }}
                style={{ overflow: "hidden" }}
              >
                <div className="mt-3">
                  <label
                    className="mb-1"
                    style={{
                      color: "#6a7282",
                      fontSize: "13px",
                    }}
                  >
                    Full name
                  </label>

                  <input
                    type="text"
                    className="sjddjs rounded-2"
                    placeholder="Full name"
                    value={userNmae}
                    onChange={(e) => setUserNmae(e.target.value)}
                  />

                  <div className="d-flex gap-3 mt-3">
                    <button
                      onClick={updateName}
                      className="rounded-3 px-3 py-2 border-0 text-white"
                      style={{ background: "#1c9641" }}
                    >
                      Save Changes
                    </button>

                    <button
                      className="rounded-3 px-3 py-2 card bg-white"
                      onClick={() => setName(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <label
            className="mb-1 mt-4"
            style={{
              color: "#6a7282",
              fontSize: "13px",
            }}
          >
            Email
          </label>

          <input
            type="email"
            className="sjddjs afmonav rounded-2"
            value={Firebase.userData?.email || ""}
            readOnly
          />
        </div>
        <div className="mt-4 mb-3 shadow-sm rounded-3 bg-white p-4 card">
          <div
            className="d-flex align-items-start justify-content-between"
            style={{ cursor: "pointer" }}
            onClick={() => setPassword(!password)}
          >
            <div>
              <p
                className="mb-0"
                style={{
                  color: "#99a1af",
                  fontWeight: "450",
                  fontSize: "13px",
                }}
              >
                PASSWORD
              </p>

              <RxDotsHorizontal size={35} />
              <RxDotsHorizontal size={35} />
            </div>

            <motion.div
              animate={{ rotate: name ? 90 : 0 }}
              transition={{ duration: 0.3 }}
              className="pt-2"
            >
              <MdKeyboardArrowRight size={23} color="#333333" />
            </motion.div>
          </div>
          <AnimatePresence initial={false}>
            {password && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: 0.25,
                  ease: "easeInOut",
                }}
                style={{ overflow: "hidden" }}
              >
                <div className="mt-3">
                  {EmailPassUser ? (
                    <div>
                      <div className="position-relative">
                        <label
                          className="mb-1"
                          style={{
                            color: "#6a7282",
                            fontSize: "13px",
                          }}
                        >
                          Current password
                        </label>

                        <input
                          type={currentPasswordShow ? "text" : "password"}
                          className="sjddjs rounded-2"
                          placeholder="Enter current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        {currentPasswordShow ? (
                          <FaRegEye
                            className="koasfamifs"
                            onClick={() => setCurrentPasswordShow(false)}
                          />
                        ) : (
                          <FaEyeSlash
                            className="koasfamifs"
                            onClick={() => setCurrentPasswordShow(true)}
                          />
                        )}
                      </div>
                      <div className="position-relative">
                        <label
                          className="mb-1 mt-3"
                          style={{
                            color: "#6a7282",
                            fontSize: "13px",
                          }}
                        >
                          New password
                        </label>

                        <input
                          type={newPasswordShow ? "text" : "password"}
                          className="sjddjs rounded-2"
                          placeholder="Enter new nassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        {newPasswordShow ? (
                          <FaRegEye
                            className="aahsfncauf"
                            onClick={() => setNewPasswordShow(false)}
                          />
                        ) : (
                          <FaEyeSlash
                            className="aahsfncauf"
                            onClick={() => setNewPasswordShow(true)}
                          />
                        )}
                      </div>
                      <div className="position-relative">
                        <label
                          className="mb-1 mt-3"
                          style={{
                            color: "#6a7282",
                            fontSize: "13px",
                          }}
                        >
                          Confirm new password
                        </label>

                        <input
                          type={confirmPasswordShow ? "text" : "password"}
                          className="sjddjs rounded-2"
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassowrd(e.target.value)}
                        />
                        {confirmPasswordShow ? (
                          <FaRegEye
                            className="aahsfncauf"
                            onClick={() => setConfirmPasswordShow(false)}
                          />
                        ) : (
                          <FaEyeSlash
                            className="aahsfncauf"
                            onClick={() => setConfirmPasswordShow(true)}
                          />
                        )}
                      </div>
                      <div className="d-flex gap-3 mt-4">
                        <button
                          className="rounded-3 px-3 py-2 border-0 text-white"
                          style={{ background: "#1c9641" }}
                          onClick={changingPass}
                        >
                          Change Password
                        </button>

                        <button
                          className="rounded-3 px-3 py-2 card bg-white"
                          onClick={() => setPassword(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <h3>Sorry, You cant change your password.</h3>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          className="logout-btn rounded-2 py-2 mt-4"
          onClick={Firebase.userLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
