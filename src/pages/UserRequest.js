import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { FaSearch, FaComment, FaBell, FaCircle, FaClock, FaPlug } from "react-icons/fa";

const UserRequest = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [blinkingTickets, setBlinkingTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Theme colors
  const colors = {
    dark: "#113946",
    medium: "#BCA37F",
    light: "#EAD7BB",
    background: "#FFF2D8",
    white: "#FFFFFF",
    alert: "#E57C23" // Orange for better alerting
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchAssignedTickets = async () => {
      setIsLoading(true);
      if (!currentUser) return;

      const { data, error } = await supabase
        .from("assignments")
        .select("ticket: tickets(id, title, created_at, priority, status, chat_initiated, user_waiting)")
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Error fetching assigned tickets:", error);
      } else if (data) {
        const assignedTickets = data.map((assignment) => assignment.ticket);
        const activeTickets = assignedTickets.filter(ticket => ticket.status !== "closed");

        // Tickets with user waiting flag become blinking
        const waitingTicketIds = activeTickets
          .filter(ticket => ticket.user_waiting)
          .map(ticket => ticket.id);
        setBlinkingTickets(waitingTicketIds);
        setTickets(activeTickets);
      }
      
      setIsLoading(false);
    };

    if (currentUser) {
      fetchAssignedTickets();

      // Real-time subscription for updates
      const subscription = supabase
        .channel('public:tickets')
        .on('UPDATE', (payload) => {
          setTickets(prev =>
            prev.map(ticket =>
              ticket.id === payload.new.id ? { ...ticket, ...payload.new } : ticket
            )
          );
          if (payload.new.user_waiting && !payload.old.user_waiting) {
            setBlinkingTickets(prev =>
              prev.includes(payload.new.id) ? prev : [...prev, payload.new.id]
            );
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.play().catch(e => console.log('Audio play failed:', e));
            } catch (error) {
              console.log('Audio initialization failed:', error);
            }
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentUser]);

  const filteredTickets = tickets.filter((ticket) =>
    ticket.title.toLowerCase().includes(search.toLowerCase())
  );

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (a.user_waiting && !b.user_waiting) return -1;
    if (!a.user_waiting && b.user_waiting) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const handleConnect = async (ticketId) => {
    const { error } = await supabase
      .from("tickets")
      .update({ 
        status: "answered", 
        chat_initiated: true,
        user_waiting: false, 
        employee_connected: true,
        employee_waiting: true
      })
      .eq("id", ticketId);

    if (error) {
      console.error("Error updating ticket:", error);
      return;
    }

    setBlinkingTickets(prev => prev.filter(id => id !== ticketId));
    navigate(`/ticket/${ticketId}`);
  };

  // Generate a time-based string for display
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMins}m ago`;
    }
  };

  // Get status color and text
  const getStatusInfo = (status) => {
    switch(status.toLowerCase()) {
      case 'open':
        return { bg: colors.light, text: colors.dark, label: 'Open' };
      case 'answered':
        return { bg: colors.medium, text: colors.white, label: 'Answered' };
      case 'closed':
        return { bg: '#989898', text: colors.white, label: 'Closed' };
      default:
        return { bg: colors.medium, text: colors.white, label: status };
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.background, color: colors.dark }}>
      {/* Header */}
      <div className="p-6 pt-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: colors.dark }}>
              User Requests
            </h1>
            <p className="text-sm" style={{ color: colors.medium }}>
              Manage and respond to your assigned tickets
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex mt-4 md:mt-0 space-x-4">
            <div className="flex items-center px-4 py-2 rounded-xl" style={{ backgroundColor: colors.dark }}>
              <FaBell className="mr-2" style={{ color: colors.light }} />
              <span style={{ color: colors.white }}>
                <strong>{blinkingTickets.length}</strong> <span className="hidden sm:inline">waiting</span>
              </span>
            </div>
            <div className="flex items-center px-4 py-2 rounded-xl" style={{ backgroundColor: colors.medium }}>
              <FaComment className="mr-2" style={{ color: colors.background }} />
              <span style={{ color: colors.dark }}>
                <strong>{tickets.length}</strong> <span className="hidden sm:inline">assigned</span>
              </span>
            </div>
          </div>
        </div>
      
        {/* Search Bar */}
        <div className="flex items-center w-full max-w-lg rounded-xl px-4 py-3 mb-6 shadow-md"
             style={{ backgroundColor: colors.white }}>
          <FaSearch style={{ color: colors.medium }} />
          <input
            type="text"
            placeholder="Search tickets..."
            className="ml-3 flex-1 outline-none"
            style={{ color: colors.dark, backgroundColor: colors.white }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="px-6 pb-8 w-full">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.medium }}></div>
          </div>
        ) : sortedTickets.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-md">
            <FaComment className="mx-auto text-5xl mb-4" style={{ color: colors.medium }} />
            <h3 className="text-xl font-medium mb-2" style={{ color: colors.dark }}>No tickets found</h3>
            <p style={{ color: colors.medium }}>No tickets are currently assigned to you</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedTickets.map((ticket) => {
              const isBlinking = blinkingTickets.includes(ticket.id);
              const statusInfo = getStatusInfo(ticket.status);
              
              return (
                <div 
                  key={ticket.id}
                  className={`relative rounded-xl shadow-md overflow-hidden transition-all duration-300 ${isBlinking ? "shadow-lg" : ""}`}
                  style={{ 
                    backgroundColor: isBlinking ? colors.white : colors.white,
                    borderLeft: isBlinking ? `5px solid ${colors.alert}` : `5px solid ${colors.dark}`,
                  }}
                >
                  {isBlinking && (
                    <div 
                      className="absolute inset-0 opacity-10 pointer-events-none" 
                      style={{ 
                        backgroundColor: colors.alert,
                        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" 
                      }}
                    ></div>
                  )}
                  
                  <div className="p-5 flex flex-col md:flex-row md:items-center">
                    {/* Ticket Information */}
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center mb-1">
                        <span className="font-semibold text-lg mr-2" style={{ color: colors.dark }}>
                          #{ticket.id}
                        </span>
                        
                        {/* Status badges */}
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium mr-2"
                          style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                        >
                          {statusInfo.label}
                        </span>
                        
                        {ticket.chat_initiated && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: colors.medium, color: colors.white }}
                          >
                            Chat Active
                          </span>
                        )}
                        
                        {isBlinking && (
                          <div className="flex items-center ml-2 px-2 py-1 rounded-full" style={{ backgroundColor: colors.alert, color: colors.white }}>
                            <FaBell className="mr-1 text-xs" />
                            <span className="text-xs font-semibold">User waiting!</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2" style={{ color: isBlinking ? colors.alert : colors.dark }}>
                        {ticket.title}
                      </h3>
                      
                      <div className="flex items-center text-sm" style={{ color: colors.medium }}>
                        <FaClock className="mr-1" />
                        <span>Created {formatTimeAgo(ticket.created_at)}</span>
                        
                        <FaCircle className="mx-2 text-[4px]" />
                        
                        {isBlinking ? (
                          <span style={{ color: colors.alert, fontWeight: 500 }}>
                            Requires immediate attention
                          </span>
                        ) : (
                          <span>Ticket #{ticket.id}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="flex justify-end">
                      {ticket.chat_initiated ? (
                        <button
                          onClick={() => navigate(`/ticket/${ticket.id}`)}
                          className="px-5 py-3 rounded-xl transition-colors flex items-center font-medium"
                          style={{ 
                            backgroundColor: colors.medium, 
                            color: colors.white,
                          }}
                        >
                          <FaComment className="mr-2" />
                          Join Chat
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(ticket.id)}
                          className={`px-5 py-3 rounded-xl transition-colors flex items-center font-medium ${isBlinking ? "animate-pulse" : ""}`}
                          style={{ 
                            backgroundColor: isBlinking ? colors.alert : colors.dark, 
                            color: colors.white,
                          }}
                        >
                          <FaPlug className="mr-2" />
                          {isBlinking ? "Connect Now!" : "Connect"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="py-4 text-center mt-auto text-sm" style={{ color: colors.medium }}>
        <p>Customer Support System • © 2025</p>
      </div>
    </div>
  );
};

export default UserRequest;