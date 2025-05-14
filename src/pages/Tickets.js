import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiPlus,
  FiChevronDown,
  FiEye,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiList,
  FiClock
} from "react-icons/fi";
import { FaTicketAlt, FaCommentDots, FaSortAmountDown, FaExclamationCircle } from "react-icons/fa";
import { supabase } from "../utils/supabase";
import TicketSubmissionModal from "../components/TicketSubmissionModal";
import { createPortal } from "react-dom";

const TicketList = ({ isSidebarOpen }) => {
  const [tickets, setTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [employeeWaitingTickets, setEmployeeWaitingTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch tickets from Supabase for the current user only
  useEffect(() => {
    const fetchTickets = async () => {
      if (!currentUser) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Error fetching tickets:", error);
      } else {
        const waitingTicketIds = data
          .filter(ticket => ticket.employee_waiting)
          .map(ticket => ticket.id);
        
        setEmployeeWaitingTickets(waitingTicketIds);
        setTickets(data);
      }
      setLoading(false);
    };

    if (currentUser) {
      fetchTickets();

      // Set up real-time subscription for ticket updates
      const subscription = supabase
        .channel('public:tickets')
        .on('UPDATE', (payload) => {
          setTickets(prev => 
            prev.map(ticket => 
              ticket.id === payload.new.id ? { ...ticket, ...payload.new } : ticket
            )
          );
          
          if (payload.new.employee_waiting && !payload.old.employee_waiting) {
            setEmployeeWaitingTickets(prev => 
              prev.includes(payload.new.id) ? prev : [...prev, payload.new.id]
            );
            
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.play().catch(e => console.log('Audio play failed:', e));
            } catch (error) {
              console.log('Audio initialization failed:', error);
            }
          } else if (!payload.new.employee_waiting && payload.old.employee_waiting) {
            setEmployeeWaitingTickets(prev => prev.filter(id => id !== payload.new.id));
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentUser]);

  // Handle ticket deletion
  const handleDeleteTicket = async (ticketId) => {
    const { error } = await supabase.from("tickets").delete().eq("id", ticketId);
    if (error) {
      console.error("Error deleting ticket:", error);
    } else {
      setTickets((prevTickets) =>
        prevTickets.filter((ticket) => ticket.id !== ticketId)
      );
    }
  };

  // Handle action button click
  const handleActionClick = (ticketId, event) => {
    if (actionDropdown === ticketId) {
      setActionDropdown(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      zIndex: 9999,
    });
    setActionDropdown(ticketId);
  };

  // Handle joining chat and clear the waiting status
  const handleJoinChat = async (ticketId) => {
    const { error } = await supabase
      .from("tickets")
      .update({ 
        employee_waiting: false,
        chat_initiated: true,
        user_connected: true
      })
      .eq("id", ticketId);

    if (error) {
      console.error("Error updating ticket:", error);
    } else {
      setEmployeeWaitingTickets(prev => prev.filter(id => id !== ticketId));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-wrapper")) {
        setActionDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      ticket.id.toString().includes(searchQuery) ||
      ticket.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.employee_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ||
      ticket.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority =
      priorityFilter === "All" ||
      ticket.priority.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort tickets - employee waiting first, then by status
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (a.employee_waiting && !b.employee_waiting) return -1;
    if (!a.employee_waiting && b.employee_waiting) return 1;

    const statusOrder = {
      "Answered": 1,
      "Open": 2,
      "Closed": 3
    };

    const orderA = statusOrder[a.status] || 99;
    const orderB = statusOrder[b.status] || 99;

    return orderA - orderB;
  });

  // Pagination logic
  const indexOfLastTicket = currentPage * entriesPerPage;
  const indexOfFirstTicket = indexOfLastTicket - entriesPerPage;
  const currentTickets = entriesPerPage === "All" 
    ? sortedTickets 
    : sortedTickets.slice(indexOfFirstTicket, indexOfLastTicket);
    
  // Calculate total pages for pagination
  const totalPages = entriesPerPage === "All" 
    ? 1 
    : Math.ceil(sortedTickets.length / entriesPerPage);

  // Get status badge styling
  const getStatusBadgeStyle = (status) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border border-gray-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "answered":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  // Get priority badge styling
  const getPriorityBadgeStyle = (priority) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  // Render dropdown with portal
  const renderDropdown = (ticketId) => {
    if (actionDropdown !== ticketId) return null;
    return createPortal(
      <div className="dropdown-wrapper" style={dropdownStyle}>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 w-36">
          <Link
            to={`/ticket/${ticketId}`}
            className="flex items-center gap-2 p-3 hover:bg-gray-50 transition-colors w-full text-left text-gray-700"
            onClick={() => setActionDropdown(null)}
          >
            <FiEye className="text-blue-500" /> 
            <span>View Details</span>
          </Link>
          <button
            className="flex items-center gap-2 p-3 hover:bg-gray-50 transition-colors w-full text-left text-gray-700 border-t border-gray-100"
            onClick={() => {
              handleDeleteTicket(ticketId);
              setActionDropdown(null);
            }}
          >
            <FiTrash2 className="text-red-500" /> 
            <span>Delete</span>
          </button>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div
      className={`transition-all duration-300 min-h-screen bg-gradient-to-b from-[#FFF2D8] to-[#F5E7C1] px-6 py-8 mt-10 ${
        isSidebarOpen ? "ml-64 w-[calc(100%-16rem)]" : "ml-0 w-full"
      }`}
    >
      {/* Header with statistics card */}
      <div className="bg-[#113946] rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h2 className="flex items-center text-3xl font-bold text-[#FFF2D8] mb-4 md:mb-0">
            <FaTicketAlt className="mr-3 text-[#EAD7BB]" /> 
            My Support Tickets
          </h2>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#EAD7BB] hover:bg-[#BCA37F] text-[#113946] font-medium px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center shadow-md"
          >
            <FiPlus className="mr-2" /> Create New Ticket
          </button>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-[#FFF2D8] text-sm mb-1 rounded-xl">Total Tickets</div>
            <div className="text-[#EAD7BB] text-2xl font-bold">{tickets.length}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-[#FFF2D8] text-sm mb-1">Open Tickets</div>
            <div className="text-[#EAD7BB] text-2xl font-bold">
              {tickets.filter(t => t.status.toLowerCase() === "open").length}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-[#FFF2D8] text-sm mb-1">Support Available</div>
            <div className="text-[#EAD7BB] text-2xl font-bold">{employeeWaitingTickets.length}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-[#FFF2D8] text-sm mb-1">Closed Tickets</div>
            <div className="text-[#EAD7BB] text-2xl font-bold">
              {tickets.filter(t => t.status.toLowerCase() === "closed").length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center mb-4">
          <FiFilter className="text-[#113946] mr-2" />
          <h3 className="text-lg font-semibold text-[#113946]">Filter & Search</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search box */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#113946] focus:border-transparent"
            />
          </div>
          
          {/* Status filter */}
          <div className="relative">
            <FiList className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#113946] focus:border-transparent appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Pending">Pending</option>
              <option value="Answered">Answered</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <FiChevronDown className="text-gray-400" />
            </div>
          </div>
          
          {/* Priority filter */}
          <div className="relative">
            <FaExclamationCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#113946] focus:border-transparent appearance-none"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <FiChevronDown className="text-gray-400" />
            </div>
          </div>
          
          {/* Entries per page */}
          <div className="relative">
            <FaSortAmountDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={entriesPerPage}
              onChange={(e) => {
                const value = e.target.value;
                setEntriesPerPage(value === "All" ? "All" : Number(value));
                setCurrentPage(1); // Reset to first page when changing entries per page
              }}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#113946] focus:border-transparent appearance-none"
            >
              <option value="All">Show All</option>
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <FiChevronDown className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tickets table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <div className="w-16 h-16 border-4 border-[#113946] border-t-[#EAD7BB] rounded-full animate-spin"></div>
            <p className="mt-4 text-[#113946] font-medium">Loading tickets...</p>
          </div>
        ) : currentTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#113946] text-[#FFF2D8]">
                  <th className="px-6 py-4 text-left font-semibold">ID</th>
                  <th className="px-6 py-4 text-left font-semibold">Title</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Priority</th>
                  <th className="px-6 py-4 text-left font-semibold">
                    <div className="flex items-center">
                      <FiClock className="mr-2" /> Created
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentTickets.map((ticket, index) => {
                  const isEmployeeWaiting = employeeWaitingTickets.includes(ticket.id);
                  
                  return (
                    <tr 
                      key={ticket.id} 
                      className={`border-b border-gray-100 ${
                        isEmployeeWaiting 
                          ? 'animate-pulse bg-gradient-to-r from-orange-50 to-yellow-50' 
                          : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-[#F9F5EB] transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-gray-700 font-medium">#{ticket.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Link 
                            to={`/ticket/${ticket.id}`} 
                            className="text-[#113946] hover:text-[#BCA37F] font-medium transition-colors"
                          >
                            {ticket.title}
                          </Link>
                          {isEmployeeWaiting && (
                            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">
                              <span className="w-2 h-2 bg-orange-500 rounded-full mr-1.5"></span>
                              Support available!
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityBadgeStyle(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {isEmployeeWaiting ? (
                            <Link
                              to={`/ticket/${ticket.id}`}
                              onClick={() => handleJoinChat(ticket.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-md"
                            >
                              <FaCommentDots /> Join Chat
                            </Link>
                          ) : (
                            <button
                              onClick={(e) => handleActionClick(ticket.id, e)}
                              className="text-gray-700 hover:text-[#113946] bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                            >
                              Actions <FiChevronDown />
                            </button>
                          )}
                          {renderDropdown(ticket.id)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FaTicketAlt className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-xl font-medium text-[#113946] mb-2">No tickets found</h3>
            <p className="text-gray-500 max-w-md mb-6">
              {searchQuery || statusFilter !== "All" || priorityFilter !== "All"
                ? "Try adjusting your filters to see more results"
                : "You haven't created any support tickets yet"}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#113946] hover:bg-[#0e2f3c] text-white font-medium px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center"
            >
              <FiPlus className="mr-2" /> Create Your First Ticket
            </button>
          </div>
        )}
        
        {/* Pagination controls */}
        {!loading && entriesPerPage !== "All" && sortedTickets.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstTicket + 1} to {Math.min(indexOfLastTicket, sortedTickets.length)} of {sortedTickets.length} tickets
              </div>
              <div className="flex space-x-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? "bg-[#113946] text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Ticket Submission Modal */}
      {isModalOpen && (
        <TicketSubmissionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TicketList;