import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiChevronDown, FiEye, FiTrash2, FiSearch, FiX } from "react-icons/fi";
import { FaTicketAlt, FaFilter } from "react-icons/fa";
import { supabase } from "../utils/supabase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageTickets = ({ isSidebarOpen, searchTerm }) => {
  // Color palette from original code
  const colors = {
    background: "#FFF2D8",
    dark: "#113946",
    medium: "#BCA37F",
    light: "#EAD7BB",
    white: "#FFFFFF",
    lightText: "#FFF2D8"
  };

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // "Show" filter: either "5" or "all"
  const [entriesPerPage, setEntriesPerPage] = useState("5");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  // Dropdown state for actions
  const [selectedTicketForActions, setSelectedTicketForActions] = useState(null);
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  // Local search state
  const [localSearch, setLocalSearch] = useState(searchTerm || "");

  // Read query param for highlighted ticket id.
  const [searchParams] = useSearchParams();
  const highlightedTicketId = searchParams.get("ticketId");

  // Fetch tickets
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        // Add a small delay to ensure Supabase connection is established
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const { data, error } = await supabase
          .from("tickets")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("Error fetching tickets:", error);
          toast.error("Failed to fetch tickets: " + error.message);
          setError(error.message);
        } else {
          // Ensure data is an array even if empty
          const ticketsData = Array.isArray(data) ? data : [];
          
          // Add fallback data if no tickets are returned and we're in development
          if (ticketsData.length === 0 && process.env.NODE_ENV === 'development') {
            setTickets(getFallbackTickets());
            toast.info("Using sample ticket data");
          } else {
            setTickets(ticketsData);
            if (ticketsData.length === 0) {
              toast.info("No tickets found");
            }
          }
          setError(null);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        toast.error("An unexpected error occurred");
        setError("Failed to connect to the database");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTickets();
  }, []);

  // Update local search when prop changes
  useEffect(() => {
    setLocalSearch(searchTerm || "");
  }, [searchTerm]);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedTicketForActions && !event.target.closest('.action-dropdown')) {
        setSelectedTicketForActions(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedTicketForActions]);

  // Open delete modal for confirmation
  const openDeleteModal = (ticketId) => {
    setTicketToDelete(ticketId);
    setShowDeleteModal(true);
    setSelectedTicketForActions(null);
  };

  // Confirm deletion
  const confirmDeleteTicket = async () => {
    try {
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", ticketToDelete);
        
      if (error) {
        console.error("Error deleting ticket:", error);
        toast.error("Failed to delete ticket");
      } else {
        setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketToDelete));
        toast.success("Ticket deleted successfully");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setShowDeleteModal(false);
      setTicketToDelete(null);
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTicketToDelete(null);
  };

  // Handle click on Actions button
  const handleActionsClick = (ticketId, event) => {
    event.stopPropagation();
    setSelectedTicketForActions(ticketId === selectedTicketForActions ? null : ticketId);
  };

  // Filter tickets based on search, status, and priority
  const filteredTickets = tickets.filter((ticket) => {
    const searchTermToUse = localSearch || searchTerm || "";
    const matchesSearch = searchTermToUse
      ? ticket.title.toLowerCase().includes(searchTermToUse.toLowerCase()) ||
        ticket.id.toString().includes(searchTermToUse) ||
        (ticket.status && ticket.status.toLowerCase().includes(searchTermToUse.toLowerCase()))
      : true;
      
    const matchesStatus =
      statusFilter === "All" ||
      (ticket.status && ticket.status.toLowerCase() === statusFilter.toLowerCase());
      
    const matchesPriority =
      priorityFilter === "All" ||
      (ticket.priority && ticket.priority.toLowerCase() === priorityFilter.toLowerCase());
      
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination logic
  const entriesCount = entriesPerPage === "all" ? filteredTickets.length : Number(entriesPerPage);
  const totalPages = Math.max(1, entriesPerPage === "all" ? 1 : Math.ceil(filteredTickets.length / entriesCount));
  const currentTickets =
    entriesPerPage === "all"
      ? filteredTickets
      : filteredTickets.slice((currentPage - 1) * entriesCount, currentPage * entriesCount);

  // Handle page change
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setStatusFilter("All");
    setPriorityFilter("All");
    setLocalSearch("");
    setCurrentPage(1);
  };

  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return "Invalid date";
    }
  };

  // Fallback tickets for development/testing
  const getFallbackTickets = () => {
    return [
      {
        id: 1001,
        title: "Login page not working",
        status: "Open",
        priority: "High",
        created_at: new Date().toISOString()
      },
      {
        id: 1002,
        title: "Dashboard loading slow",
        status: "Pending",
        priority: "Medium",
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 1003,
        title: "Missing icons in sidebar",
        status: "Resolved",
        priority: "Low",
        created_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 1004,
        title: "User settings not saving",
        status: "Open",
        priority: "High",
        created_at: new Date(Date.now() - 259200000).toISOString()
      },
      {
        id: 1005,
        title: "Reports export failing",
        status: "Closed",
        priority: "Medium",
        created_at: new Date(Date.now() - 345600000).toISOString()
      }
    ];
  };

  return (
    <div
      className={`tickets-container transition-all duration-300 ${
        isSidebarOpen ? "ml-64 w-[calc(100%-16rem)]" : "ml-0 w-full"
      } p-6`}
      style={{ backgroundColor: colors.background }}
    >
      {/* Header Section */}
      <div className="tickets-header flex flex-col md:flex-row md:items-center justify-between py-4 mb-6">
        <h2 className="flex items-center text-3xl font-bold mb-4 md:mb-0" style={{ color: colors.dark }}>
          <FaTicketAlt className="mr-3" style={{ color: colors.medium }} /> 
          <span className="relative">
            Manage Tickets
          </span>
        </h2>
        
        {/* Search component */}
        <div className="relative w-full md:w-72 z-0">
          <FiSearch className="absolute left-3 top-3" style={{ color: colors.dark }} />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full py-2 pl-10 pr-4 rounded-full border focus:outline-none"
            style={{ 
              backgroundColor: colors.white, 
              color: colors.dark,
              borderColor: colors.medium 
            }}
          />
          {localSearch && (
            <button 
              onClick={() => setLocalSearch("")}
              className="absolute right-3 top-3 hover:opacity-70"
              style={{ color: colors.dark }}
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div
        className="p-4 rounded-xl shadow-lg mb-6"
        style={{ backgroundColor: colors.dark }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-3">
          <h3 className="flex items-center text-lg font-semibold mb-3 md:mb-0" style={{ color: colors.lightText }}>
            <FaFilter className="mr-2" /> Filter Tickets
          </h3>
          
          <div className="flex space-x-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-md hover:opacity-90 transition-opacity duration-200 flex items-center"
              style={{ backgroundColor: colors.light, color: colors.dark }}
            >
              <FiX className="mr-1" /> Reset Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Show Entries Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium" style={{ color: colors.lightText }}>Show Entries</label>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(e.target.value);
                setCurrentPage(1);
              }}
              className="p-2 rounded-md border focus:outline-none"
              style={{ 
                backgroundColor: colors.background, 
                color: colors.dark,
                borderColor: colors.medium 
              }}
            >
              <option value="5">5 entries</option>
              <option value="all">All entries</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium" style={{ color: colors.lightText }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="p-2 rounded-md border focus:outline-none"
              style={{ 
                backgroundColor: colors.background, 
                color: colors.dark,
                borderColor: colors.medium 
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium" style={{ color: colors.lightText }}>Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="p-2 rounded-md border focus:outline-none"
              style={{ 
                backgroundColor: colors.background, 
                color: colors.dark,
                borderColor: colors.medium 
              }}
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-8" style={{ color: colors.dark }}>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent mb-4"></div>
          <p className="font-medium">Loading tickets...</p>
        </div>
      )}

      {!loading && error && (
        <div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" 
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Results Summary */}
      {!loading && !error && (
        <div className="flex justify-between items-center mb-4">
          <p style={{ color: colors.dark }}>
            Showing {currentTickets.length} of {filteredTickets.length} tickets
            {(statusFilter !== "All" || priorityFilter !== "All" || localSearch) && (
              <span> (filtered)</span>
            )}
          </p>
          
          {entriesPerPage !== "all" && totalPages > 0 && (
            <p style={{ color: colors.dark }}>
              Page {currentPage} of {totalPages}
            </p>
          )}
        </div>
      )}

      {/* Tickets Table */}
      {!loading && !error && (
        <div className="overflow-auto rounded-xl shadow-md mb-6" style={{ backgroundColor: colors.dark }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: colors.medium }}>
                <th className="p-3 text-left font-semibold" style={{ color: colors.dark }}>ID</th>
                <th className="p-3 text-left font-semibold" style={{ color: colors.dark }}>Title</th>
                <th className="p-3 text-left font-semibold" style={{ color: colors.dark }}>Status</th>
                <th className="p-3 text-left font-semibold" style={{ color: colors.dark }}>Priority</th>
                <th className="p-3 text-left font-semibold" style={{ color: colors.dark }}>Created</th>
                <th className="p-3 text-center font-semibold" style={{ color: colors.dark }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTickets.length > 0 ? (
                currentTickets.map((ticket, index) => (
                  <tr
                    key={ticket.id}
                    className="border-b transition-colors duration-150"
                    style={{ 
                      backgroundColor: ticket.id.toString() === highlightedTicketId ? colors.light : colors.dark,
                      borderColor: colors.medium,
                      color: ticket.id.toString() === highlightedTicketId ? colors.dark : colors.lightText
                    }}
                  >
                    <td className="p-3">#{ticket.id}</td>
                    <td className="p-3">
                      <Link 
                        to={`/ticket/${ticket.id}`} 
                        className="font-medium hover:underline transition-colors duration-200"
                        style={{ color: colors.light }}
                      >
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span 
                        className="px-3 py-1 text-xs font-medium rounded-full"
                        style={{ 
                          backgroundColor: colors.light,
                          color: colors.dark 
                        }}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span 
                        className="px-3 py-1 text-xs font-medium rounded-full"
                        style={{ 
                          backgroundColor: 
                            ticket.priority?.toLowerCase() === "high" ? colors.medium :
                            ticket.priority?.toLowerCase() === "medium" ? colors.light : 
                            colors.background,
                          color: colors.dark 
                        }}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-3">{formatDate(ticket.created_at)}</td>
                    <td className="p-3 text-center">
                      <div className="relative inline-block action-dropdown">
                        <button
                          onClick={(e) => handleActionsClick(ticket.id, e)}
                          className="px-3 py-1 rounded-xl inline-flex items-center hover:opacity-90 transition-opacity duration-200"
                          style={{ 
                            backgroundColor: colors.light,
                            color: colors.dark
                          }}
                        >
                          Actions <FiChevronDown className="ml-1" />
                        </button>
                        
                        {selectedTicketForActions === ticket.id && (
                          <div
                            className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ring-1 ring-opacity-5"
                            style={{ 
                              backgroundColor: colors.background, 
                              top: "100%",
                              borderColor: colors.medium
                            }}
                          >
                            <div className="py-1">
                              <Link
                                to={`/ticket/${ticket.id}`}
                                className="block px-4 py-2 text-sm hover:opacity-80"
                                style={{ color: colors.dark }}
                              >
                                <FiEye className="inline mr-2" /> View Details
                              </Link>
                              {/* Uncomment if needed
                              <button
                                onClick={() => openDeleteModal(ticket.id)}
                                className="block w-full text-left px-4 py-2 text-sm hover:opacity-80"
                                style={{ color: colors.dark }}
                              >
                                <FiTrash2 className="inline mr-2" /> Delete Ticket
                              </button>
                              */}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-6 text-center" style={{ color: colors.lightText }}>
                    No tickets match your filters. Try adjusting your search criteria or creating new tickets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && entriesPerPage !== "all" && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-md transition-opacity duration-200 disabled:opacity-50"
            style={{
              backgroundColor: colors.light,
              color: colors.dark,
            }}
          >
            First
          </button>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-md transition-opacity duration-200 disabled:opacity-50"
            style={{
              backgroundColor: colors.light,
              color: colors.dark,
            }}
          >
            Previous
          </button>
          
          <div 
            className="flex items-center px-4 py-2 rounded-md border"
            style={{ 
              backgroundColor: colors.background, 
              borderColor: colors.medium,
              color: colors.dark 
            }}
          >
            <span>
              {currentPage} of {totalPages}
            </span>
          </div>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-md transition-opacity duration-200 disabled:opacity-50"
            style={{
              backgroundColor: colors.light,
              color: colors.dark,
            }}
          >
            Next
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-md transition-opacity duration-200 disabled:opacity-50"
            style={{
              backgroundColor: colors.light,
              color: colors.dark,
            }}
          >
            Last
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div 
            className="rounded-xl shadow-lg p-6 max-w-md mx-auto transform transition-all duration-300 scale-100"
            style={{ backgroundColor: colors.background }}
          >
            <h3 
              className="text-xl font-bold mb-4" 
              style={{ color: colors.dark }}
            >
              Confirm Delete
            </h3>
            <p 
              className="mb-6" 
              style={{ color: colors.dark }}
            >
              Are you sure you want to delete this ticket? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-md border hover:opacity-80 transition-opacity duration-200"
                style={{ 
                  backgroundColor: colors.light,
                  color: colors.dark,
                  borderColor: colors.medium
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTicket}
                className="px-4 py-2 rounded-md hover:opacity-80 transition-opacity duration-200"
                style={{ 
                  backgroundColor: colors.medium,
                  color: colors.dark 
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default ManageTickets;