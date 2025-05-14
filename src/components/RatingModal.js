import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import { supabase } from "../utils/supabase";

const RatingModal = ({ show, onClose, employeeId, ticketId }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [experience, setExperience] = useState("");

  if (!show) return null;

  const handleSubmit = async () => {
    // Fetch current customer (user) to set as customer_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("User not authenticated");
      return;
    }

    // Insert rating into employee_ratings table with customer_id included
    const { error } = await supabase.from("employee_ratings").insert([
      {
        employee_id: employeeId,
        ticket_id: ticketId,
        rating,
        experience_text: experience,
        customer_id: user.id, // Save current user's id as customer_id
      },
    ]);

    if (error) {
      console.error("Error submitting rating:", error);
      alert("There was an error submitting your rating.");
    } else {
      alert("Thank you for your feedback!");
      setRating(0);
      setExperience("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-opacity-70 z-50" style={{ backgroundColor: "#113946" }}>
      <div className="p-6 rounded-lg shadow-xl max-w-md w-full" style={{ backgroundColor: "#FFF2D8", border: "1px solid #BCA37F" }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: "#113946" }}>Your ticket has been closed</h2>
        <p className="mb-4" style={{ color: "#113946" }}>How was your experience?</p>
        <div className="flex justify-center mb-6">
          {[...Array(5)].map((star, index) => {
            const ratingValue = index + 1;
            return (
              <label key={ratingValue} className="mx-1">
                <input
                  type="radio"
                  name="rating"
                  className="hidden"
                  value={ratingValue}
                  onClick={() => setRating(ratingValue)}
                />
                <FaStar
                  size={36}
                  className="cursor-pointer transition-colors duration-200"
                  color={ratingValue <= (hover || rating) ? "#BCA37F" : "#EAD7BB"}
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                />
              </label>
            );
          })}
        </div>
        <textarea
          placeholder="Share your experience with us..."
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="w-full p-3 rounded-lg mb-6 focus:outline-none"
          rows="3"
          style={{ 
            backgroundColor: "#EAD7BB", 
            border: "1px solid #BCA37F",
            color: "#113946"
          }}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: "#EAD7BB", 
              color: "#113946",
              border: "1px solid #BCA37F"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#113946" }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;