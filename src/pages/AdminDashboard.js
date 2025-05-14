import React, { useState, useEffect, useCallback, useRef } from "react"; 
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { supabase } from "../utils/supabase"; // Import Supabase client
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FaBriefcase,
  FaEnvelope,
  FaUnlockAlt,
  FaLock,
  FaExclamationTriangle,
  FaArrowLeft,
  FaCheck,
  FaThumbsUp,
  FaFlag,
  FaRobot,
  FaTimes,
  FaExclamation,
  FaSpinner,
} from "react-icons/fa";

// Modal component for ticket analysis
const AnalysisModal = ({ isOpen, onClose, ticketsToAnalyze, onAnalysisComplete }) => {
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [analyzedResults, setAnalyzedResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [error, setError] = useState(null);
  
  // Use refs to keep track of the latest state in async functions
  const ticketsRef = useRef(ticketsToAnalyze);
  const currentIndexRef = useRef(currentTicketIndex);
  const resultsRef = useRef(analyzedResults);
  const flaggedCountRef = useRef(flaggedCount);
  
  // Update refs when state changes
  useEffect(() => {
    ticketsRef.current = ticketsToAnalyze;
    currentIndexRef.current = currentTicketIndex;
    resultsRef.current = analyzedResults;
    flaggedCountRef.current = flaggedCount;
  }, [ticketsToAnalyze, currentTicketIndex, analyzedResults, flaggedCount]);
  
  // Function to analyze a single ticket
  const analyzeTicket = useCallback(async (ticket) => {
    try {
      console.log(`Analyzing ticket ${ticket.id}: "${ticket.title}"`);
      
      // Simulated API call to Mistral (replace with actual implementation)
      const isFlagged = await new Promise((resolve) => {
        setTimeout(() => {
          // Simple simulation - flag tickets containing certain keywords
          const contentToCheck = `${ticket.title} ${ticket.description || ''}`.toLowerCase();
          const flagWords = ['test', 'spam', 'xxx', 'fuck', 'shit', 'asshole', 'bla bla', 'asdf'];
          const containsFlaggedContent = flagWords.some(word => contentToCheck.includes(word));
          
          let flagReason = null;
          if (containsFlaggedContent) {
            // Find which word triggered the flag
            const triggeredWord = flagWords.find(word => contentToCheck.includes(word));
            flagReason = `Contains inappropriate content: "${triggeredWord}"`;
          }
          
          resolve({ 
            isFlagged: containsFlaggedContent, 
            reason: flagReason 
          });
        }, 500); // Simulate API delay
      });
      
      // In a real implementation, you would call the Mistral API here:
      /*
      const response = await fetch(process.env.REACT_APP_MISTRAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          prompt: `You are a strict content moderation system. Analyze the following support ticket content and flag it if it contains ANY of these issues:
          1. Foul language or profanity of any kind
          2. Unnecessary personal data or sensitive information
          3. Off-topic content not related to a genuine support issue
          4. Gibberish or nonsensical text (like "bla bla bla")
          5. Spam, advertisements, or marketing content
          6. Excessive punctuation or capitalization
          7. Test messages or placeholder text
          8. Empty or nearly empty messages
          9. Random characters or keysmashes

          Ticket Title: ${ticket.title}
          Ticket Description: ${ticket.description || ''}

          First, analyze the content line by line.
          Then provide your final decision.
          
          If ANY issues are detected, respond with "FLAG: [reason]"
          If the content is appropriate, respond with "PASS"`,
          temperature: 0.0,
          max_tokens: 100
        })
      });
      
      const data = await response.json();
      const result = data.output.content.trim();
      const isFlagged = { 
        isFlagged: result.includes("FLAG"), 
        reason: result.includes("FLAG") ? result.match(/FLAG:\s*(.*)/)[1].trim() : null 
      };
      */
      
      // Update the ticket's flag status in the database
      const { error } = await supabase
        .from('tickets')
        .update({ 
          is_flagged: isFlagged.isFlagged,
          flag_reason: isFlagged.reason,
          analyzed_at: new Date().toISOString()
        })
        .eq('id', ticket.id);
        
      if (error) {
        console.error(`Error updating ticket ${ticket.id}:`, error);
        throw error;
      }
      
      return {
        ...ticket,
        isFlagged: isFlagged.isFlagged,
        flagReason: isFlagged.reason
      };
        
    } catch (error) {
      console.error(`Error analyzing ticket ${ticket.id}:`, error);
      throw error;
    }
  }, []);
  
  // Start or continue the analysis process
  const continueAnalysis = useCallback(async () => {
    if (currentIndexRef.current >= ticketsRef.current.length) {
      // Analysis complete
      setIsAnalyzing(false);
      if (onAnalysisComplete) {
        onAnalysisComplete(flaggedCountRef.current);
      }
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const ticket = ticketsRef.current[currentIndexRef.current];
      const result = await analyzeTicket(ticket);
      
      // Update states
      const newResults = [...resultsRef.current, result];
      setAnalyzedResults(newResults);
      
      if (result.isFlagged) {
        setFlaggedCount(prev => prev + 1);
      }
      
      // Move to next ticket
      setCurrentTicketIndex(prev => prev + 1);
      
      // Continue with next ticket after a short delay
      setTimeout(continueAnalysis, 200);
      
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze ticket. Please try again.");
      setIsAnalyzing(false);
    }
  }, [analyzeTicket, onAnalysisComplete]);
  
  // Start analysis when modal opens
  useEffect(() => {
    if (isOpen && ticketsToAnalyze.length > 0 && !isAnalyzing) {
      // Reset state when starting a new analysis
      setCurrentTicketIndex(0);
      setAnalyzedResults([]);
      setFlaggedCount(0);
      setError(null);
      
      // Start the analysis process
      continueAnalysis();
    }
  }, [isOpen, ticketsToAnalyze, isAnalyzing, continueAnalysis]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#FFF2D8] rounded-xl shadow-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#113946]">
            <FaRobot className="inline mr-2" /> AI Ticket Analysis
          </h2>
          <button 
            onClick={onClose}
            className="text-[#113946] hover:text-gray-800"
          >
            <FaTimes size={24} />
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div 
              className="bg-[#113946] h-4 rounded-full transition-all duration-300"
              style={{ 
                width: ticketsToAnalyze.length ? 
                  `${(currentTicketIndex / ticketsToAnalyze.length) * 100}%` : 
                  '0%' 
              }}
            ></div>
          </div>
          <div className="text-sm text-gray-600">
            Analyzed {currentTicketIndex} of {ticketsToAnalyze.length} tickets
            {flaggedCount > 0 && ` (${flaggedCount} flagged)`}
          </div>
        </div>
        
        {/* Current ticket being analyzed */}
        {isAnalyzing && currentTicketIndex < ticketsToAnalyze.length && (
          <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center mb-2">
              <FaSpinner className="animate-spin mr-2 text-[#113946]" />
              <span className="font-semibold">Currently analyzing:</span>
            </div>
            <p className="text-lg font-medium">{ticketsToAnalyze[currentTicketIndex].title}</p>
            <p className="text-gray-600 truncate">
              {ticketsToAnalyze[currentTicketIndex].description || 'No description'}
            </p>
          </div>
        )}
        
        {/* Analysis results */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Analysis Results:</h3>
          
          {analyzedResults.length === 0 && !isAnalyzing ? (
            <p className="text-gray-500">No tickets have been analyzed yet.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {analyzedResults.map((result, index) => (
                <div 
                  key={result.id} 
                  className={`p-3 mb-2 rounded-lg border ${
                    result.isFlagged ? 
                      'bg-red-50 border-red-200' : 
                      'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full mr-3 ${
                      result.isFlagged ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {result.isFlagged ? 
                        <FaExclamation className="text-red-500" /> : 
                        <FaCheck className="text-green-500" />
                      }
                    </div>
                    <div>
                      <p className="font-medium">{result.title}</p>
                      {result.isFlagged && (
                        <p className="text-red-600 text-sm mt-1">
                          {result.flagReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="p-3 mt-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Analysis complete message */}
          {!isAnalyzing && currentTicketIndex === ticketsToAnalyze.length && ticketsToAnalyze.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <FaCheck className="text-green-500 mr-2" />
                <span className="font-semibold">Analysis complete!</span>
              </div>
              <p className="mt-2">
                Found {flaggedCount} {flaggedCount === 1 ? 'ticket' : 'tickets'} that require attention.
              </p>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-[#113946] text-white rounded-lg hover:bg-opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const EmployeeActivityStatus = () => {
  // Same component as in your original code
  const [employees, setEmployees] = useState([]);
  const [loadingEmp, setLoadingEmp] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmp(true);
        const { data, error } = await supabase
          .from("users")
          .select("id, name, is_online, is_on_live_chat, last_activity_at")
          .eq("role", "employee");
          
        if (error) throw error;
        
        const now = new Date();
        const computed = (data || []).map((emp) => {
          let status = "Offline";
          if (emp.is_on_live_chat) {
            status = "On Live Chat";
          } else if (emp.is_online) {
            const last = emp.last_activity_at ? new Date(emp.last_activity_at) : 0;
            status = now - last > 30 * 60 * 1000 ? "Away" : "Online";
          }
          return { ...emp, status };
        });
        
        setEmployees(computed);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoadingEmp(false);
      }
    };
    
    fetchEmployees();
    
    // Set up a refresh interval for employee status
    const refreshInterval = setInterval(fetchEmployees, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <div className="bg-[#113946] p-4 rounded-xl shadow mt-10">
      <h2 className="text-xl font-semibold mb-3 text-[#FFF2D8]">
        Employee Activity Status
      </h2>
      {loadingEmp ? (
        <p className="text-[#FFF2D8]">Loading employee status...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#BCA37F] text-[#FFF2D8]">
              <th className="p-2 text-left">Employee</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="2" className="p-2 text-center text-[#FFF2D8]">
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="border-b border-[#EAD7BB]">
                  <td className="p-2 text-[#FFF2D8]">{emp.name}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded ${
                        emp.status === "Online"
                          ? "bg-[#EAD7BB] text-[#113946]"
                          : emp.status === "On Live Chat"
                          ? "bg-[#BCA37F] text-[#FFF2D8]"
                          : "bg-[#FFF2D8] text-[#113946]"
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Moderation state
  const [flaggedTicketsCount, setFlaggedTicketsCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketsToAnalyze, setTicketsToAnalyze] = useState([]);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [newTicketSubscription, setNewTicketSubscription] = useState(null);
  
  // Fetch flagged tickets count
  const fetchFlaggedTicketsCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('tickets')
        .select('id', { head: true, count: 'exact' })
        .eq('is_flagged', true);
        
      if (error) throw error;
      setFlaggedTicketsCount(count || 0);
    } catch (error) {
      console.error("Error fetching flagged tickets count:", error);
      setFlaggedTicketsCount(0);
    }
  }, []);
  
  // Function to open modal and start analysis
  const startTicketAnalysis = useCallback(async () => {
    try {
      setIsAnalysisRunning(true);
      
      // Get tickets from the last 24 hours that haven't been analyzed
      const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();
      const { data, error } = await supabase
        .from('tickets')
        .select('id, title, description')
        .gt('created_at', twentyFourHoursAgo)
        .is('analyzed_at', null)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setTicketsToAnalyze(data);
        setIsModalOpen(true);
      } else {
        // No tickets to analyze
        alert("No new tickets to analyze in the last 24 hours.");
        setIsAnalysisRunning(false);
      }
    } catch (error) {
      console.error("Error preparing ticket analysis:", error);
      setIsAnalysisRunning(false);
      alert("Failed to load tickets for analysis. Please try again.");
    }
  }, []);
  
  // Handle completion of analysis
  const handleAnalysisComplete = useCallback((flaggedCount) => {
    fetchFlaggedTicketsCount();
    setIsAnalysisRunning(false);
  }, [fetchFlaggedTicketsCount]);
  
  // Setup real-time listener for new tickets
  useEffect(() => {
    // Set up the subscription for real-time ticket creation
    const setupTicketSubscription = async () => {
      const subscription = supabase
        .channel('tickets-channel')
        .on('INSERT', { event: 'INSERT', schema: 'public', table: 'tickets' }, 
          async (payload) => {
            console.log('New ticket created:', payload);
            
            try {
              // Get the newly created ticket
              const newTicket = payload.new;
              
              // Analyze single ticket using the Mistral API (simplified implementation)
              const isFlagged = await new Promise((resolve) => {
                setTimeout(() => {
                  // Simplified check - in real implementation, call Mistral API
                  const contentToCheck = `${newTicket.title} ${newTicket.description || ''}`.toLowerCase();
                  const flagWords = ['test', 'spam', 'xxx', 'fuck', 'shit', 'asshole', 'bla bla', 'asdf'];
                  const containsFlaggedContent = flagWords.some(word => contentToCheck.includes(word));
                  
                  let flagReason = null;
                  if (containsFlaggedContent) {
                    const triggeredWord = flagWords.find(word => contentToCheck.includes(word));
                    flagReason = `Contains inappropriate content: "${triggeredWord}"`;
                  }
                  
                  resolve({ 
                    isFlagged: containsFlaggedContent, 
                    reason: flagReason 
                  });
                }, 500);
              });
              
              // Update ticket in database
              await supabase
                .from('tickets')
                .update({
                  is_flagged: isFlagged.isFlagged,
                  flag_reason: isFlagged.reason,
                  analyzed_at: new Date().toISOString()
                })
                .eq('id', newTicket.id);
              
              // Update flagged count if needed
              if (isFlagged.isFlagged) {
                fetchFlaggedTicketsCount();
              }
            } catch (error) {
              console.error('Error processing new ticket:', error);
            }
          }
        )
        .subscribe();
      
      setNewTicketSubscription(subscription);
    };
    
    setupTicketSubscription();
    
    // Cleanup subscription on component unmount
    return () => {
      if (newTicketSubscription) {
        supabase.removeChannel(newTicketSubscription);
      }
    };
  }, [fetchFlaggedTicketsCount]);
  
  // Initialize flagged tickets count
  useEffect(() => {
    fetchFlaggedTicketsCount();
  }, [fetchFlaggedTicketsCount]);

  // Fetch ticket statistics and recent tickets
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();

        // Batch fetch statistics with Promise.all for better performance
        const [
          totalTicketsResult,
          newTicketsResult,
          openTicketsResult,
          closedTicketsResult,
          urgentTicketsResult,
          unansweredTicketsResult,
          answeredTicketsResult,
          { data: ticketsData, error: ticketsError }
        ] = await Promise.all([
          supabase.from("tickets").select("count", { head: true, count: "exact" }),
          supabase.from("tickets").select("count", { head: true, count: "exact" }).gt("created_at", twentyFourHoursAgo),
          supabase.from("tickets").select("count", { head: true, count: "exact" }).eq("status", "open"),
          supabase.from("tickets").select("count", { head: true, count: "exact" }).eq("status", "closed"),
          supabase.from("tickets").select("count", { head: true, count: "exact" }).ilike("priority", "high"),
          supabase.from("tickets").select("count", { head: true, count: "exact" }).eq("status", "open").lt("created_at", twentyFourHoursAgo),
          supabase.from("tickets").select("count", { head: true, count: "exact" }).eq("status", "answered"),
          supabase
            .from("tickets")
            .select("id, title, created_at, status, priority, description")
            .order("created_at", { ascending: false })
            .limit(4)
        ]);

        if (ticketsError) throw ticketsError;

        // Set stats
        setStats([
          {
            label: "Total Tickets",
            value: totalTicketsResult.count || 0,
            icon: <FaBriefcase className="text-2xl" />,
            bgColor: "#113946",
          },
          {
            label: "New Tickets",
            value: newTicketsResult.count || 0,
            icon: <FaEnvelope className="text-2xl" />,
            bgColor: "#113946",
          },
          {
            label: "Open Tickets",
            value: openTicketsResult.count || 0,
            icon: <FaUnlockAlt className="text-2xl" />,
            bgColor: "#113946",
          },
          {
            label: "Closed Tickets",
            value: closedTicketsResult.count || 0,
            icon: <FaLock className="text-2xl" />,
            bgColor: "#113946",
          },
          {
            label: "Urgent Tickets",
            value: urgentTicketsResult.count || 0,
            icon: <FaExclamationTriangle className="text-2xl" />,
            bgColor: "#113946",
          },
          {
            label: "Un-Answered Tickets",
            value: unansweredTicketsResult.count || 0,
            icon: <FaArrowLeft className="text-2xl" />,
            bgColor: "#113946",
          },
          {
            label: "Answered Tickets",
            value: answeredTicketsResult.count || 0,
            icon: <FaCheck className="text-2xl" />,
            bgColor: "#113946",
          },
          {
            label: "Solved Tickets",
            value: closedTicketsResult.count || 0,
            icon: <FaThumbsUp className="text-2xl" />,
            bgColor: "#113946",
          },
        ]);

        // Process recent tickets
        setRecentTickets(
          (ticketsData || []).map((ticket) => ({
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            updated: new Date(ticket.created_at).toLocaleString(),
            action: ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1),
            status: ticket.status === "open" ? "Opened" : "Closed",
            statusColor: ticket.status === "open" ? "#FFF2D8" : "#EAD7BB",
            priority: ticket.priority,
          }))
        );

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Set up refresh interval for dashboard
    const dashboardRefreshInterval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    
    return () => clearInterval(dashboardRefreshInterval);
  }, []);

  // Fetch top performers
  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        const { data: closedTicketsData, error: ticketsError } = await supabase
          .from("tickets")
          .select("closed_by")
          .eq("status", "closed");

        if (ticketsError) throw ticketsError;

        // Skip processing if no closed tickets
        if (!closedTicketsData || closedTicketsData.length === 0) {
          setTopPerformers([]);
          return;
        }

        // Count tickets closed by each user
        const performersMap = {};
        closedTicketsData.forEach((ticket) => {
          if (ticket.closed_by) {
            performersMap[ticket.closed_by] = (performersMap[ticket.closed_by] || 0) + 1;
          }
        });

        const userIds = Object.keys(performersMap).filter(id => id); // Filter out null/empty IDs
        
        if (userIds.length === 0) {
          setTopPerformers([]);
          return;
        }

        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, name, profile_picture, role")
          .in("id", userIds);

        if (usersError) throw usersError;

        // Map user data to performers
        const performersArray = userIds.map((userId) => {
          const user = usersData.find((u) => u.id === userId);
          return {
            userId,
            name: user?.name || "Unknown",
            profile_picture: user?.profile_picture || "default-avatar.png",
            role: user?.role || "",
            solved_tickets: performersMap[userId],
          };
        });

        // Sort by number of solved tickets
        performersArray.sort((a, b) => b.solved_tickets - a.solved_tickets);
        setTopPerformers(performersArray);
      } catch (err) {
        console.error("Error fetching top performers:", err);
        setTopPerformers([]);
      }
    };

    fetchTopPerformers();
  }, []);

  // Prepare chart data
  const chartData = {
    labels: stats.map((stat) => stat.label),
    datasets: [
      {
        label: "Ticket Count",
        data: stats.map((stat) => stat.value),
        backgroundColor: stats.map(() => "#113946"),
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#FFF2D8",
        barThickness: 25,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Ticket Statistics",
        color: "#FFF2D8",
        font: { size: 16, weight: "600" },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#FFF2D8", font: { size: 12 } },
      },
      y: {
        grid: { color: "#EAD7BB" },
        ticks: { color: "#FFF2D8", font: { size: 12 } },
      },
    },
  };

  return (
    <div className="pt-20 p-6 bg-[#FFF2D8] min-h-screen flex flex-col space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <h1 className="text-3xl font-bold text-[#113946]">Admin Dashboard</h1>

          <div className="" 
             style={{ backgroundColor: "transparent" }}>
          </div>

        {/* AI Moderation Cards */}
        {/* Flagged Tickets Card - Now clickable to view flagged tickets */}
        <Link to="/managetickets?filter=flagged" className="block">
          <div className="p-4 rounded-xl text-white flex flex-col justify-center items-center shadow-lg cursor-pointer hover:shadow-xl transition-all" 
             style={{ backgroundColor: "#FF3B30" }}>
            <FaFlag className="text-2xl" />
            <p className="text-2xl font-bold mt-2">{flaggedTicketsCount}</p>
            <p className="text-md">Flagged Tickets</p>
          </div>
        </Link>
        
        {/* AI Admin Card - Now a button to open the analysis modal */}
        <div 
          onClick={startTicketAnalysis}
          className={`p-4 rounded-xl text-white flex flex-col justify-center items-center shadow-lg cursor-pointer hover:shadow-xl transition-all ${isAnalysisRunning ? 'opacity-70' : 'hover:bg-[#113946]'}`}
          style={{ backgroundColor: isAnalysisRunning ? "#808080" : "#113946" }}
        >
          <FaRobot className="text-2xl" />
          <p className="text-2xl font-bold mt-2">
            {isAnalysisRunning ? <FaSpinner className="animate-spin mx-auto" /> : "Run Analysis"}
          </p>
          <p className="text-md">AI Ticket Moderation</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-4 rounded-xl text-white flex flex-col justify-center items-center shadow-lg"
            style={{ backgroundColor: "#113946" }}
          >
            <div>{stat.icon}</div>
            <p className="text-2xl font-bold mt-2">{isLoading ? "..." : stat.value}</p>
            <p className="text-md">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Tickets & Employee Activity Status */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Recent Tickets Section */}
  <div className="bg-[#113946] p-4 md:p-6 rounded-xl shadow-lg">
    <h2 className="text-lg md:text-xl font-semibold mb-4 text-[#FFF2D8]">
      Recent Tickets
    </h2>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#BCA37F] text-[#FFF2D8]">
            <th className="p-2 md:p-3 text-left">#</th>
            <th className="p-2 md:p-3 text-left">Title</th>
            <th className="p-2 md:p-3 text-left">Updated</th>
            <th className="p-2 md:p-3 text-left">Action</th>
            <th className="p-2 md:p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan="5" className="p-4 text-center text-[#FFF2D8]">
                Loading tickets...
              </td>
            </tr>
          ) : recentTickets.length === 0 ? (
            <tr>
              <td colSpan="5" className="p-4 text-center text-[#FFF2D8]">
                No tickets found
              </td>
            </tr>
          ) : (
            recentTickets.map((ticket, index) => (
              <tr key={ticket.id} className="border-b border-[#EAD7BB]">
                <td className="p-2 md:p-3 text-[#FFF2D8]">{index + 1}</td>
                <td className="p-2 md:p-3">
                  <Link
                    to={`/managetickets?ticketId=${ticket.id}`}
                    className="text-[#FFF2D8] hover:underline"
                  >
                    {ticket.title}
                  </Link>
                </td>
                <td className="p-2 md:p-3 text-[#FFF2D8]">{ticket.updated}</td>
                <td className="p-2 md:p-3">
                  <span className="px-2 md:px-3 py-1 rounded bg-[#BCA37F] text-[#FFF2D8]">
                    {ticket.action}
                  </span>
                </td>
                <td className="p-2 md:p-3">
                  <span
                    className="px-2 md:px-3 py-1 rounded"
                    style={{
                      backgroundColor: ticket.statusColor,
                      color: "#113946",
                    }}
                  >
                    {ticket.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>

  {/* Employee Activity Status Section */}
  <EmployeeActivityStatus />
</div>

{/* Chart and Top Performers Section */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
  {/* Bar Chart */}
  <div
    className="bg-[#113946] p-4 md:p-6 rounded-xl shadow-lg flex justify-center items-center"
    style={{ height: "300px" }}
  >
    {isLoading ? (
      <div className="text-[#FFF2D8]">Loading chart data...</div>
    ) : (
      <Bar data={chartData} options={chartOptions} />
    )}
  </div>

  {/* Top Performers */}
  <div className="bg-[#113946] p-4 md:p-6 rounded-xl shadow-lg">
    <h2 className="text-lg md:text-xl font-semibold mb-4 text-[#FFF2D8]">
      Top Performers
    </h2>
    {isLoading ? (
      <p className="text-[#FFF2D8]">Loading top performers...</p>
    ) : topPerformers.length === 0 ? (
      <p className="text-[#FFF2D8]">No performer data found.</p>
    ) : (
      <ol className="list-decimal pl-5 text-[#FFF2D8]">
        {topPerformers.map((user) => (
          <li key={user.userId} className="mb-4 flex items-center gap-3">
            <img
              src={user.profile_picture}
              alt={user.name}
              className="w-8 md:w-10 h-8 md:h-10 rounded-full"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "default-avatar.png";
              }}
            />
            <div>
              <p className="font-semibold text-sm md:text-base">{user.name}</p>
              <p className="text-xs md:text-sm text-[#EAD7BB]">
                {user.solved_tickets} ticket{user.solved_tickets !== 1 ? "s" : ""} solved
              </p>
            </div>
          </li>
        ))}
      </ol>
    )}
  </div>
</div>

{/* Footer with Buttons */}
<div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-4 md:p-6 bg-[#113946] text-[#FFF2D8] rounded-xl shadow-lg">
  <span className="text-base md:text-lg font-semibold mb-4 sm:mb-0">
    Manage your tickets efficiently
  </span>
  <div className="space-x-0 sm:space-x-4 space-y-4 sm:space-y-0">
    <Link to="/managetickets">
      <button className="px-4 py-2 bg-[#FFF2D8] hover:bg-[#BCA37F] rounded-xl shadow text-[#113946] text-sm">
        Manage Tickets
      </button>
    </Link>
    <Link to="/assigntickets">
      <button className="px-4 py-2 bg-[#FFF2D8] hover:bg-[#BCA37F] rounded-xl shadow text-[#113946] text-sm">
        Assign Tickets
      </button>
    </Link>
  </div>
</div>

{/* Analysis Modal */}
<AnalysisModal 
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  ticketsToAnalyze={ticketsToAnalyze}
  onAnalysisComplete={handleAnalysisComplete}
/>
</div>
  );
}
export default Dashboard;