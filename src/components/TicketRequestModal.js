import React, { useState } from "react";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";

const TicketRequestModal = ({ show, onClose, ticket, onRequestSubmitted }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  const handleCloseTicket = async () => {
    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      // Update ticket status to indicate closure requested.
      const { error } = await supabase
        .from("tickets")
        .update({
          status: "requested",
          closed_by: user.id,
        })
        .eq("id", ticket.id);

      if (error) {
        toast.error("Error submitting request: " + error.message);
      } else {
        toast.success("Closure request submitted successfully");
        onRequestSubmitted(ticket.id, user.id);
        onClose();
      }
    } catch (error) {
      toast.error("An error occurred: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#FFF2D8] rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-[#113946]">Request Ticket Closure</h2>
        <div className="mb-4">
          <p className="text-[#113946]">
            You are requesting to close ticket: <strong>{ticket.title}</strong>
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#EAD7BB] text-[#113946] rounded-md hover:bg-[#BCA37F] transition duration-200"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={handleCloseTicket}
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#BCA37F] text-white rounded-md hover:bg-[#113946] transition duration-200"
          >
            {isSubmitting ? "Submitting..." : "Yes, Close Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketRequestModal;
