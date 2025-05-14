import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { supabase } from '../utils/supabase';
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ResetPasswordModal({ isOpen, onClose, token }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
    minLength: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const navigate = useNavigate();

  // Ensure we have a valid session when the component loads
  useEffect(() => {
    if (!isOpen) return;

    const initializeAuth = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        try {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');
          
          if (accessToken && type === 'recovery') {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            console.log("Set auth session from URL parameters");
          }
        } catch (error) {
          console.error("Error setting auth session:", error);
        }
      }
    };

    initializeAuth();
  }, [isOpen]);

  // Password validation function
  const validatePassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);

    setPasswordChecks({
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /\d/.test(value),
      specialChar: /[@$!%*?&]/.test(value),
      minLength: value.length >= 8,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword(newPassword)) {
      setPasswordError(
        "❌ Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character."
      );
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("❌ Passwords do not match");
      return;
    }
    
    setPasswordError("");
    setIsSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      let error;
      
      if (sessionData?.session) {
        const { error: updateError } = await supabase.auth.updateUser({ 
          password: newPassword 
        });
        error = updateError;
      } else {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });
          
          const { error: updateError } = await supabase.auth.updateUser({ 
            password: newPassword 
          });
          error = updateError;
        } else {
          error = new Error("No authentication session or token found");
        }
      }

      if (error) throw error;

      toast.success("Password has been reset successfully!");
      setResetSuccess(true);
      
      setTimeout(() => {
        onClose();
        supabase.auth.signOut().then(() => {
          navigate("/login");
          window.location.reload();
        });
      }, 2000);
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when the modal is closed
  const handleClose = () => {
    if (!isSubmitting) {
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setResetSuccess(false);
      onClose();
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#FFF2D8] rounded-lg shadow-lg p-6 w-full max-w-md relative">
        {/* Close button */}
        <button 
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-[#BCA37F] hover:text-[#113946]"
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-[#113946]">
          Reset Password
        </h2>

        {resetSuccess ? (
          <div className="text-center">
            <div className="mb-4 text-[#BCA37F] text-6xl flex justify-center">
              ✅
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[#113946]">
              Password Reset Complete
            </h3>
            <p className="text-[#113946] mb-6">
              Your password has been successfully reset. You'll be redirected to login shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div className="mb-4">
              <label 
                htmlFor="newPassword" 
                className="block mb-2 text-sm font-medium text-[#113946]"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your new password"
                  required
                  className="w-full px-4 py-2 pr-10 border border-[#BCA37F] rounded-md focus:outline-none focus:ring-2 focus:ring-[#113946] bg-[#FFF2D8] text-[#113946]"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#BCA37F]"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-2 mb-4">
              <div className={`flex items-center gap-2 transition-all duration-300 ${passwordChecks.uppercase ? 'text-[#113946]' : 'text-[#EAD7BB]'}`}>
                <input type="checkbox" checked={passwordChecks.uppercase} readOnly className="form-checkbox" />
                <span className="text-sm">Uppercase letter</span>
              </div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${passwordChecks.lowercase ? 'text-[#113946]' : 'text-[#EAD7BB]'}`}>
                <input type="checkbox" checked={passwordChecks.lowercase} readOnly className="form-checkbox" />
                <span className="text-sm">Lowercase letter</span>
              </div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${passwordChecks.number ? 'text-[#113946]' : 'text-[#EAD7BB]'}`}>
                <input type="checkbox" checked={passwordChecks.number} readOnly className="form-checkbox" />
                <span className="text-sm">Number</span>
              </div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${passwordChecks.specialChar ? 'text-[#113946]' : 'text-[#EAD7BB]'}`}>
                <input type="checkbox" checked={passwordChecks.specialChar} readOnly className="form-checkbox" />
                <span className="text-sm">Special character</span>
              </div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${passwordChecks.minLength ? 'text-[#113946]' : 'text-[#EAD7BB]'}`}>
                <input type="checkbox" checked={passwordChecks.minLength} readOnly className="form-checkbox" />
                <span className="text-sm">8 characters or more</span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label 
                htmlFor="confirmPassword" 
                className="block mb-2 text-sm font-medium text-[#113946]"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  className="w-full px-4 py-2 pr-10 border border-[#BCA37F] rounded-md focus:outline-none focus:ring-2 focus:ring-[#113946] bg-[#FFF2D8] text-[#113946]"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#BCA37F]"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Password Error */}
            {passwordError && (
              <div className="mb-4 text-[#BCA37F] text-sm">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 px-4 bg-[#BCA37F] hover:bg-[#113946] text-white font-semibold rounded-md transition duration-200 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
