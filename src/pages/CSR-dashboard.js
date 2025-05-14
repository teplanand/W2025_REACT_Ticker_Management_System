import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";
import Navbar from "../components/Navbar";
import { FaClock, FaTasks, FaCheckCircle, FaStar, FaUser, FaMailBulk } from "react-icons/fa";
import { supabase } from "../utils/supabase";
// Import Chart.js auto-registration to fix "category" scale errors
import "chart.js/auto";
import { format } from "date-fns";

// --- Pastel Card Classes (from your AdminAnalyticsDashboard screenshot) ---
const cardBase = "p-4 rounded-lg border";
const cardOpen = `${cardBase} bg-yellow-50 border-yellow-100 text-yellow-700`;       // Open
const cardUnassigned = `${cardBase} bg-orange-50 border-orange-100 text-orange-600`; // Unassigned
const cardResponse = `${cardBase} bg-blue-50 border-blue-100 text-blue-600`;         // First Response
const cardSLA = `${cardBase} bg-green-50 border-green-100 text-green-700`;           // SLA
const cardCSAT = `${cardBase} bg-purple-50 border-purple-100 text-purple-600`;       // CSAT
const cardWorkload = `${cardBase} bg-indigo-50 border-indigo-100 text-indigo-600`;   // Workload

// Page container and card styles (similar to your AdminAnalyticsDashboard)
const pageContainer = "w-full min-h-screen bg-gray-50 text-gray-800 overflow-x-hidden";
const mainContent = "pt-24 px-4 lg:px-8 mx-auto max-w-[100vw]";
const gridContainer = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6";
const cardContainer = "bg-white rounded-lg shadow-md p-4 mb-4";
const cardTitle = "text-lg font-semibold text-blue-800 mb-2 text-center";

const CSRdashboard = () => {
  const [ticketSummary, setTicketSummary] = useState([]);
  const [ticketChartData, setTicketChartData] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Theme colors
  const colors = {
    dark: "#113946",
    medium: "#BCA37F",
    light: "#EAD7BB",
    background: "#FFF2D8",
  };

  // Fetch dashboard data (ticket summary, chart data, etc.)
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Calculate timestamp for the start of today (used for cards)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartISO = todayStart.toISOString();

        // --- LIVE TICKETS DATA (Cards) ---
        const { data: openTicketsData, error: openError } = await supabase
          .from("tickets")
          .select("id, assignments(*)")
          .eq("status", "open");
        if (openError) {
          console.error("Error fetching open tickets:", openError);
        }
        const openTicketsCount = openTicketsData ? openTicketsData.length : 0;
        const assignedCount = openTicketsData
          ? openTicketsData.filter(
              (ticket) =>
                ticket.assignments && ticket.assignments.length > 0
            ).length
          : 0;
        const unassignedCount = openTicketsCount - assignedCount;

        // --- RESPONSE TIME TODAY DATA (Cards) ---
        const { data: answeredData, error: answeredError } = await supabase
          .from("tickets")
          .select("created_at, first_response_at")
          .eq("status", "answered")
          .gte("created_at", todayStartISO);
        if (answeredError) {
          console.error("Error fetching answered tickets:", answeredError);
        }
        let avgResponseTime = 0;
        if (answeredData && answeredData.length > 0) {
          const totalResponseTime = answeredData.reduce((acc, ticket) => {
            if (ticket.first_response_at) {
              return acc + (new Date(ticket.first_response_at) - new Date(ticket.created_at));
            }
            return acc;
          }, 0);
          avgResponseTime = Math.round(totalResponseTime / answeredData.length / 60000);
        }

        // --- EMPLOYEE WORKLOAD (Tickets Assigned for Cards) ---
        let assignmentsCount = 0;
        const { data: currentUserData } = await supabase.auth.getUser();
        const currentUserId = currentUserData?.user?.id;
        if (currentUserId) {
          const { count } = await supabase
            .from("assignments")
            .select("*", { head: true, count: "exact" })
            .eq("user_id", currentUserId);
          assignmentsCount = count || 0;
        }

        // --- BUILD SUMMARY DATA (Cards) ---
        const summary = [
          {
            section: "Live Tickets",
            items: [
              { label: "Open Tickets", value: openTicketsCount, icon: <FaTasks /> },
              { label: "Unassigned", value: unassignedCount, icon: <FaMailBulk /> },
            ],
          },
          {
            section: "Response Time Today",
            items: [
              { label: "First Response Time", value: avgResponseTime ? `${avgResponseTime}m` : "N/A", icon: <FaClock /> },
              { label: "SLA Compliance", value: avgResponseTime && avgResponseTime <= 30 ? "100%" : "0%", icon: <FaCheckCircle /> },
            ],
          },
          {
            section: "CSAT Today",
            items: [
              { label: "CSAT", value: "89%", icon: <FaStar /> },
            ],
          },
          {
            section: "Employee Workload",
            items: [
              { label: "Tickets Assigned", value: assignmentsCount, icon: <FaUser /> },
            ],
          },
        ];
        setTicketSummary(summary);

        // --- TICKET CHART DATA (Assigned vs Unassigned Tickets - All Time) ---
        const { data: allTickets, error: allError } = await supabase
          .from("tickets")
          .select("created_at, assignments(*)");
        if (allError) {
          console.error("Error fetching all tickets:", allError);
        }
        // Group by hour-of-day from each ticket's created_at
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const chartDataFromBackend = hours.map((hour) => {
          const label = `${hour.toString().padStart(2, "0")}:00`;
          const assigned = allTickets
            ? allTickets.filter((ticket) => {
                const date = new Date(ticket.created_at);
                return (
                  date.getHours() === hour &&
                  ticket.assignments &&
                  ticket.assignments.length > 0
                );
              }).length
            : 0;
          const unassigned = allTickets
            ? allTickets.filter((ticket) => {
                const date = new Date(ticket.created_at);
                return (
                  date.getHours() === hour &&
                  (!ticket.assignments || ticket.assignments.length === 0)
                );
              }).length
            : 0;
          return { time: label, assigned, unassigned };
        });
        setTicketChartData(chartDataFromBackend);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch customer feedback for the logged-in employee only
  useEffect(() => {
    const fetchFeedback = async () => {
      const { data: currentUserData } = await supabase.auth.getUser();
      const currentUserId = currentUserData?.user?.id;
      const { data, error } = await supabase
        .from("employee_ratings")
        .select("experience_text, rating, created_at, customer:customer_id(email, profile_picture)")
        .eq("employee_id", currentUserId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching feedback:", error.message);
      } else {
        setFeedback(data);
      }
    };

    fetchFeedback();
  }, []);

  // Render star ratings
  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={index < rating ? "text-[#EAD7BB]" : "text-gray-400"}
            size={16}
          />
        ))}
      </div>
    );
  };

  return (
    <div 
      className="w-full min-h-screen overflow-x-hidden"
      style={{ background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.light} 100%)` }}
    >
      <Navbar />
      <div className="pt-24 px-4 lg:px-8 mx-auto w-full max-w-[100vw]">
        
        {/* Ticket Summary Section */}
        <div className={`${gridContainer} animate-fadeIn`}>
          {ticketSummary.map((section, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-[#113946] to-[#0e2f3a] text-white"
              style={{ 
                boxShadow: "0 10px 15px -3px rgba(17, 57, 70, 0.2), 0 4px 6px -2px rgba(17, 57, 70, 0.1)",
                transform: "translateY(0)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(17, 57, 70, 0.3), 0 10px 10px -5px rgba(17, 57, 70, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(17, 57, 70, 0.2), 0 4px 6px -2px rgba(17, 57, 70, 0.1)";
              }}
            >
              <div className="bg-[#BCA37F] h-2 w-full"></div>
              <div className="p-5">
                <h2 className="text-xl font-semibold text-[#EAD7BB] mb-4 border-b border-[#BCA37F] pb-2">
                  {section.section}
                </h2>
                <div className="grid gap-3">
                  {section.items.map((item, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg flex items-center justify-between bg-[#0a252f] hover:bg-[#0c2c37] transition-all duration-300"
                    >
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-[#BCA37F] text-[#113946] mr-4">
                          {item.icon}
                        </div>
                        <p className="text-sm text-[#EAD7BB]">{item.label}</p>
                      </div>
                      <h2 className="text-2xl font-bold text-[#EAD7BB]">
                        {isLoading ? (
                          <div className="w-12 h-8 bg-[#1c5264] rounded animate-pulse"></div>
                        ) : (
                          item.value
                        )}
                      </h2>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10 animate-fadeIn">
          {/* Assigned vs Unassigned Tickets Chart */}
          <div className="bg-gradient-to-br from-[#113946] to-[#0e2f3a] p-6 rounded-xl shadow-lg w-full h-[500px] relative overflow-hidden">
            <div className="bg-[#BCA37F] h-2 w-full absolute top-0 left-0"></div>
            <h3 className="text-xl font-semibold mb-4 text-[#EAD7BB] border-b border-[#BCA37F] pb-2">
              Assigned vs Unassigned Tickets
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="w-16 h-16 border-4 border-[#EAD7BB] border-t-[#BCA37F] rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={ticketChartData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(188, 163, 127, 0.2)" />
                    <XAxis dataKey="time" stroke="#EAD7BB">
                      <Label
                        value="Time of the Day"
                        offset={-20}
                        position="insideBottom"
                        fill="#EAD7BB"
                      />
                    </XAxis>
                    <YAxis stroke="#EAD7BB">
                      <Label
                        value="Number of Tickets"
                        angle={-90}
                        position="insideLeft"
                        fill="#EAD7BB"
                      />
                    </YAxis>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#113946",
                        borderColor: "#BCA37F",
                        color: "#EAD7BB",
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      }}
                      labelStyle={{ color: "#EAD7BB" }}
                      itemStyle={{ color: "#EAD7BB" }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      wrapperStyle={{ color: "#EAD7BB" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="assigned"
                      stroke="#BCA37F"
                      strokeWidth={3}
                      name="Assigned Tickets"
                      dot={{ stroke: '#BCA37F', strokeWidth: 2, r: 4, fill: '#113946' }}
                      activeDot={{ stroke: '#BCA37F', strokeWidth: 2, r: 6, fill: '#EAD7BB' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="unassigned"
                      stroke="#EAD7BB"
                      strokeWidth={3}
                      name="Unassigned Tickets"
                      dot={{ stroke: '#EAD7BB', strokeWidth: 2, r: 4, fill: '#113946' }}
                      activeDot={{ stroke: '#EAD7BB', strokeWidth: 2, r: 6, fill: '#BCA37F' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Customer Feedback with Star Ratings */}
          <div className="bg-gradient-to-br from-[#113946] to-[#0e2f3a] p-6 rounded-xl shadow-lg w-full relative overflow-hidden">
            <div className="bg-[#BCA37F] h-2 w-full absolute top-0 left-0"></div>
            <h3 className="text-xl font-semibold mb-4 text-[#EAD7BB] border-b border-[#BCA37F] pb-2">
              Customer Feedback
            </h3>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[#0a252f] p-4 rounded-lg animate-pulse flex items-start">
                    <div className="w-10 h-10 rounded-full bg-[#1c5264] mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-[#1c5264] rounded w-24 mb-2"></div>
                      <div className="h-3 bg-[#1c5264] rounded w-full mb-1"></div>
                      <div className="h-3 bg-[#1c5264] rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="max-h-[400px] overflow-y-auto space-y-4 pr-2"
                style={{ 
                  scrollbarWidth: "thin",
                  scrollbarColor: "#BCA37F transparent" 
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 4px;
                  }
                  div::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  div::-webkit-scrollbar-thumb {
                    background-color: #BCA37F;
                    border-radius: 20px;
                  }
                `}</style>
                {feedback.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <FaStar className="text-[#BCA37F] text-5xl mb-4" />
                    <p className="text-[#EAD7BB]">No feedback available yet</p>
                    <p className="text-[#BCA37F] text-sm mt-2">Feedback will appear here as customers rate your service</p>
                  </div>
                ) : (
                  feedback.map((fb, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 bg-[#0a252f] p-4 rounded-lg shadow hover:bg-[#0c2c37] transition-all duration-300"
                    >
                      <div className="relative">
                        <img
                          src={
                            fb.customer?.profile_picture ||
                            "https://via.placeholder.com/50"
                          }
                          alt={fb.customer?.email || "User"}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#BCA37F]"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#BCA37F] rounded-full flex items-center justify-center text-[#113946] text-xs font-bold">
                          {fb.rating}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-2">{renderStars(fb.rating)}</div>
                        <p className="text-[#EAD7BB] mb-1">{fb.experience_text}</p>
                        <p className="text-[#BCA37F] text-xs">
                          {new Date(fb.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-10 text-center py-4 text-[#113946] opacity-70">
          <p>© 2025 Customer Support Dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default CSRdashboard;
