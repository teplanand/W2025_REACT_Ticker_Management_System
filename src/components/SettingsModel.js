import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const SettingsModal = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // (Unused in this theme)
  const modalRef = useRef(null);

  // Fetch current user from Supabase auth
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle deletion: Mark user as deleted and prevent future logins
  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error("User not found.");
      return;
    }
    setIsDeleting(true);
    try {
      // Soft delete by setting a flag in the "users" table
      const { error: updateError } = await supabase
        .from("users")
        .update({ is_deleted: true })
        .match({ id: user.id });

      if (updateError) {
        throw new Error(`Failed to mark user as deleted: ${updateError.message}`);
      }

      toast.success("Account removed successfully!");

      // Log out the user
      await supabase.auth.signOut();
      window.location.href = "/"; // Redirect to homepage or login page
    } catch (error) {
      console.error("Error removing account:", error.message);
      toast.error("Failed to remove account: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="p-6 rounded-2xl shadow-xl w-80 max-w-md"
        style={{
          backgroundColor: "#FFF2D8",
          border: "1px solid #BCA37F"
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" style={{ color: "#113946" }}>
            ⚙️ Settings
          </h2>
          <button
            className="hover:text-[#EAD7BB]"
            style={{ color: "#BCA37F" }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Delete Account Section */}
        <div className="mt-6">
          <h3
            className="text-lg font-medium mb-3"
            style={{ color: "#113946" }}
          >
            ⚠️ Danger Zone
          </h3>
          {showConfirmation ? (
            <motion.div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#EAD7BB" }}
            >
              <p
                className="text-sm mb-3"
                style={{ color: "#113946" }}
              >
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <div className="flex justify-between">
                <button
                  className="rounded px-3 py-1"
                  style={{ backgroundColor: "#BCA37F", color: "#FFF2D8" }}
                  onClick={() => setShowConfirmation(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="rounded px-3 py-1"
                  style={{ backgroundColor: "#113946", color: "#FFF2D8" }}
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              className="w-full rounded px-4 py-2"
              style={{ backgroundColor: "#EAD7BB", color: "#113946" }}
              onClick={() => setShowConfirmation(true)}
            >
              Delete Account
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-center">
          <button
            className="rounded px-4 py-2"
            style={{ backgroundColor: "#BCA37F", color: "#FFF2D8" }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;
