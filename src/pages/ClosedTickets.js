import React, { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaTicketAlt, FaSort, FaCalendarAlt } from "react-icons/fa";
import { supabase } from "../utils/supabase";

const ClosedTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [sortBy, setSortBy] = useState("date");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchClosedTickets = async () => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch closed tickets for the current user
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("status", "closed")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching closed tickets:", error);
      } else {
        setTickets(data);
      }
      setLoading(false);
    };

    fetchClosedTickets();
  }, []);

  // Sorting, filtering, and searching:
  const sortedFilteredTickets = [...tickets]
    .filter((ticket) => filter === "All" || ticket.priority === filter)
    .filter((ticket) => 
      searchTerm === "" || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.closedDate || a.created_at) - new Date(b.closedDate || b.created_at);
      }
      if (sortBy === "priority") {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0;
    });

  // Priority badge styling function
  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
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

  return (
    <div className="main-content closed-tickets-container w-full px-4 py-6">
      {/* Page Header */}
      <div className="bg-[#113946] shadow-lg rounded-xl p-4 md:p-6 mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-[#FFF2D8] flex items-center gap-3">
            <FaTicketAlt className="text-[#EAD7BB]" />
            Closed Tickets
          </h1>
          <p className="text-[#BCA37F] mt-2 md:mt-0">
            Total: <span className="font-bold">{sortedFilteredTickets.length}</span>
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search Box */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#FFF2D8] border border-[#BCA37F] focus:outline-none focus:ring-2 focus:ring-[#113946] focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="relative">
            <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#FFF2D8] border border-[#BCA37F] focus:outline-none focus:ring-2 focus:ring-[#113946] appearance-none cursor-pointer transition-all"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Sort by Date Closed</option>
              <option value="priority">Sort by Priority</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#FFF2D8] border border-[#BCA37F] focus:outline-none focus:ring-2 focus:ring-[#113946] appearance-none cursor-pointer transition-all"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="mx-auto mt-6 bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="w-16 h-16 border-4 border-[#113946] border-t-[#EAD7BB] rounded-full animate-spin"></div>
            <p className="mt-4 text-[#113946] font-medium">Loading tickets...</p>
          </div>
        ) : sortedFilteredTickets.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-[#113946] text-[#FFF2D8]">
                  <th className="p-3 md:p-4 text-left font-semibold">#</th>
                  <th className="p-3 md:p-4 text-left font-semibold">Ticket Details</th>
                  <th className="p-3 md:p-4 text-left font-semibold">Date Closed</th>
                  <th className="p-3 md:p-4 text-center font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedFilteredTickets.map((ticket, index) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-100 hover:bg-[#F9F5EB] transition-colors duration-150"
                  >
                    <td className="p-3 md:p-4 text-[#113946] font-medium">{index + 1}</td>
                    <td className="p-3 md:p-4">
                      <div className="font-medium text-[#113946]">{ticket.title}</div>
                      {ticket.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {ticket.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3 md:p-4">
                      <div className="flex items-center text-gray-600">
                        <FaCalendarAlt className="mr-2 text-[#BCA37F]" />
                        {new Date(ticket.closedDate || ticket.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                      </div>
                    </td>
                    <td className="p-3 md:p-4">
                      <div className="flex justify-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadgeStyle(ticket.priority)}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state flex flex-col items-center justify-center p-8 md:p-12 text-center">
            <div className="w-16 md:w-20 h-16 md:h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FaTicketAlt className="text-gray-400 text-xl md:text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-[#113946]">No closed tickets found</h3>
            <p className="mt-2 text-gray-500 max-w-md">
              {filter !== "All" 
                ? `No ${filter} priority tickets have been closed yet.` 
                : "You don't have any closed tickets at the moment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClosedTickets;