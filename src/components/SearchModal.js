import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import { supabase } from "../utils/supabase";

const SearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [onClose]);

  useEffect(() => {
    const searchTickets = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select("*")
          .or(`title.ilike.%${searchQuery}%,id.eq.${!isNaN(searchQuery) ? searchQuery : 0}`)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error("Error searching tickets:", error);
      } finally {
        setIsLoading(false);
      }
    };
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        searchTickets();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleTicketClick = (ticketId) => {
    onClose();
    navigate(`/ticket/${ticketId}`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 backdrop-blur-lg rounded-xl"
      style={{ backgroundColor: "transparent" }}
    >
      <div ref={modalRef} className="bg-[#FFF2D8] w-full max-w-xl rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b flex items-center bg-[#113946] text-[#FFF2D8]">
          <FiSearch className="mr-2" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by title or ID..."
            className="flex-1 outline-none bg-transparent text-[#FFF2D8] placeholder-[#FFF2D8]"
          />
          <button onClick={onClose} className="hover:text-[#EAD7BB] transition-colors">
            <FiX size={20} />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center flex items-center justify-center text-[#BCA37F]">
              <div className="w-5 h-5 border-2 border-[#BCA37F] border-t-[#EAD7BB] rounded-full animate-spin mr-2"></div>
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <ul>
              {searchResults.map((ticket) => (
                <li
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket.id)}
                  className="p-3 cursor-pointer border-b flex justify-between items-center transition-colors duration-200"
                  style={{ color: "#113946" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#BCA37F";
                    e.currentTarget.style.color = "#FFF2D8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#113946";
                  }}
                >
                  <div>
                    <p className="font-medium">{ticket.title}</p>
                    <p className="text-sm">ID: {ticket.id}</p>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === "Open"
                          ? "bg-[#EAD7BB] text-[#113946]"
                          : ticket.status === "Pending"
                          ? "bg-[#BCA37F] text-[#FFF2D8]"
                          : ticket.status === "Closed"
                          ? "bg-[#FFF2D8] text-[#113946]"
                          : ticket.status === "Resolved"
                          ? "bg-[#EAD7BB] text-[#113946]"
                          : "bg-[#FFF2D8] text-[#113946]"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : searchQuery ? (
            <div className="p-4 text-center text-[#BCA37F]">No tickets found matching "{searchQuery}"</div>
          ) : (
            <div className="p-4 text-center text-[#BCA37F]">Type to search for tickets</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
