import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../utils/supabase'; // Import Supabase client

export default function RegisterPage() {
  // State variables
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user'); // Default role
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null); // State for profile picture
  const [isUploading, setIsUploading] = useState(false); // State for upload loading
  const navigate = useNavigate();

  // Password validation function
  const validatePassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  // Handle profile picture upload to Cloudinary
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET); // Upload preset from Cloudinary

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      return data.secure_url; // Return the uploaded image URL
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      setPasswordError(
        '❌ Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('❌ Passwords do not match!');
      return;
    }

    setPasswordError(''); // Clear error if valid

    try {
      setIsUploading(true); // Start loading

      // Upload profile picture to Cloudinary (if selected)
      let profilePictureUrl = null;
      if (profilePicture) {
        profilePictureUrl = await uploadImage(profilePicture);
      }

      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role,
            profile_picture: profilePictureUrl, // Add profile picture URL to user metadata
          },
        },
      });

      if (error) throw error;

      // Insert user profile into the `users` table
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email,
            name,
            phone,
            role,
            profile_picture: profilePictureUrl, // Store profile picture URL
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;

      // Display success toast notification
      toast.success('🦄 Registration successful! Email confirmation is required before login', {
        position: 'top-center',
        autoClose: 5000, // Show for 5 seconds
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Redirect to login page after successful registration
      setTimeout(() => {
        navigate('/login');
      }, 1000); // Delay navigation to allow the toast to be visible
    } catch (error) {
      toast.error(error.message); // Display error toast
    } finally {
      setIsUploading(false); // Stop loading
    }
  };

  // Password visibility toggle handlers
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="register-container min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/bg.png')" }}>
      <h1 className="register-title">Register</h1>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label className="form-label">
            Name <span className="required">*</span>
          </label>
          <input
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            Email <span className="required">*</span>
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            Password <span className="required">*</span>
          </label>
          <div className="password-container">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input password-input"
            />
            <span
              className="password-toggle"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">
            Confirm Password <span className="required">*</span>
          </label>
          <div className="password-container">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="form-input password-input"
            />
            <span
              className="password-toggle"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>
        {passwordError && <p className="error-text">{passwordError}</p>}
        
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role <span className="required">*</span></label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="form-input"
            >
              <option value="user">User</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Profile Picture Upload */}
<div className="form-group full-width">
  <label className="form-label" htmlFor="profile-picture">
    Profile Picture (Optional)
  </label>
  <label htmlFor="profile-picture" className="dropzone block">
    {profilePicture ? (
      <div className="image-preview">
        <img
          src={URL.createObjectURL(profilePicture)} // Show preview of the selected image
          alt="Preview"
          className="preview-image"
        />
      </div>
    ) : (
      <p className="dropzone-text">
        Drag & drop an image here, or click to select one.
      </p>
    )}
  </label>
  <input
    id="profile-picture"
    type="file"
    accept="image/*"
    className="form-input-file hidden"
    onChange={(e) => setProfilePicture(e.target.files[0])} // Update state with the selected file
  />
</div>

        <button type="submit" className="submit-btn" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Sign-Up'}
        </button>
      </form>
      <div className="login-link">
        <p>
          Already have an account?{' '}
          <span className="login-link-text" onClick={() => navigate('/login')}>
            Log in
          </span>
        </p>
      </div>
      {/* ToastContainer renders toast notifications */}
      <ToastContainer />
    </div>
  );
}