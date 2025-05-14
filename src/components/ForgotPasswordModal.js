import { useState } from "react";
import { toast } from "react-toastify";
import { supabase } from '../utils/supabase';
import { FaTimes } from "react-icons/fa";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const origin = window.location.origin;
      const redirectTo = `${origin}/login`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo
      });

      if (error) throw error;

      setFormSubmitted(true);
      toast.success("Password reset link sent to your email");
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when the modal is closed
  const handleClose = () => {
    setEmail("");
    setFormSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#FFF2D8] rounded-lg shadow-lg p-6 w-full max-w-md relative">
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#BCA37F] hover:text-[#113946]"
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-[#113946]">
          Reset Password
        </h2>

        {formSubmitted ? (
          <div className="text-center">
            <div className="mb-4 text-[#BCA37F] text-6xl flex justify-center">
              ✉️
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[#113946]">
              Check Your Email
            </h3>
            <p className="text-[#113946] mb-6">
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your inbox and follow the instructions.
            </p>
            <button
              onClick={handleClose}
              className="w-full py-2 px-4 bg-[#BCA37F] hover:bg-[#113946] text-white font-semibold rounded-md transition duration-200"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label 
                htmlFor="email" 
                className="block mb-2 text-sm font-medium text-[#113946]"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full px-4 py-2 border border-[#BCA37F] rounded-md focus:outline-none focus:ring-2 focus:ring-[#113946] bg-[#FFF2D8] text-[#113946]"
              />
              <p className="mt-2 text-sm text-[#113946]">
                We'll send a password reset link to this email.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 px-4 bg-[#BCA37F] hover:bg-[#113946] text-white font-semibold rounded-md transition duration-200 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
