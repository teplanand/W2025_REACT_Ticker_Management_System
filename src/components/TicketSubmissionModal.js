import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "../utils/supabase"; // Import Supabase client
import "../styles/global.css";

const TicketSubmissionModal = ({ isOpen, onClose }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Fetch current user on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  // Function to upload image to Cloudinary
  const uploadImageToCloudinary = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to upload image: ${response.statusText}`);
      }
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      toast.error("Image upload failed. Submitting ticket without image.");
      return null;
    }
  };

  // Handle ticket form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const toastId = "ticket-submit-toast";

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Insert ticket data into Supabase
      const { data: ticketData, error: insertError } = await supabase
        .from("tickets")
        .insert([
          {
            name: data.name,
            email: data.email,
            category: data.category,
            priority: data.priority,
            title: data.title,
            description: data.description,
            image_url: imageUrl,
            status: "open",
            created_at: new Date().toISOString(),
            user_id: user.id,
          },
        ])
        .select();

      if (insertError) {
        throw insertError;
      }

      toast.success("Ticket submitted successfully!", {
        position: "top-center",
        autoClose: 3000,
        toastId,
        hideProgressBar: true,
      });

      // Prepare ticket data for the email notification
      const ticket = {
        name: data.name,
        email: data.email,
        title: data.title,
      };

      // Call the local API endpoint to send an email
      try {
        const response = await fetch("https://twilio-backend-service-production.up.railway.app/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket }),
        });
        const result = await response.json();
        if (!response.ok) {
          console.error("Email sending failed:", result.error);
        }
      } catch (emailError) {
        console.error("Error calling email endpoint:", emailError);
      }

      // Close modal and navigate after a delay
      setTimeout(() => {
        onClose();
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      toast.error("Failed to submit ticket. Please try again.", {
        position: "top-center",
        autoClose: 3000,
        toastId,
        hideProgressBar: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image file selection and preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Cleanup image preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-title">Submit a Ticket</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
          {/* Name Input */}
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              placeholder="Enter your name"
              type="text"
              {...register("name", { required: "Name is required" })}
              className="form-input"
            />
            {errors.name && <p className="error-message">{errors.name.message}</p>}
          </div>
          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              placeholder="Enter your email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  message: "Invalid email",
                },
              })}
              className="form-input"
            />
            {errors.email && <p className="error-message">{errors.email.message}</p>}
          </div>
          {/* Category Select */}
          <div className="form-group">
            <label htmlFor="category">Issue Category</label>
            <select
              id="category"
              {...register("category", { required: "Issue category is required" })}
              className="form-select"
            >
              <option value="">Select a category</option>
              <option value="technical">Technical</option>
              <option value="system_crash">System Crash</option>
              <option value="software_bug">Software Bug</option>
              <option value="connectivity_issue">Connectivity Issue</option>
              <option value="billing">Billing</option>
              <option value="data_loss">Data Loss</option>
              <option value="security">Security</option>
              <option value="general">General</option>
            </select>
            {errors.category && <p className="error-message">{errors.category.message}</p>}
          </div>
          {/* Priority Select */}
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              {...register("priority", { required: "Priority is required" })}
              className="form-select"
            >
              <option value="">Select priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            {errors.priority && <p className="error-message">{errors.priority.message}</p>}
          </div>
          {/* Title Textarea */}
          <div className="form-group full-width">
            <label htmlFor="title">Title</label>
            <textarea
              id="title"
              placeholder="Enter a brief title for the issue"
              {...register("title", { required: "Title is required" })}
              className="form-textarea"
            ></textarea>
            {errors.title && <p className="error-message">{errors.title.message}</p>}
          </div>
          {/* Description Textarea */}
          <div className="form-group full-width">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Describe your issue in detail..."
              {...register("description", { required: "Description is required" })}
              className="form-textarea"
            ></textarea>
            {errors.description && <p className="error-message">{errors.description.message}</p>}
          </div>
          {/* Image Upload */}
          <div className="form-group full-width">
            <label htmlFor="image">Upload Image (optional)</label>
            <label htmlFor="image" className="dropzone block">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              ) : (
                <p className="dropzone-text">Drag & drop an image here, or click to select one.</p>
              )}
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="form-input-file hidden"
            />
          </div>
          {/* Submit Button */}
          <div className="form-group full-width">
            <button type="submit" disabled={isSubmitting} className="form-button">
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default TicketSubmissionModal;
