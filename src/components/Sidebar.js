import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { 
  FiHome, FiFileText, FiPlusCircle, FiCheckCircle, 
  FiSettings, FiArrowLeftCircle, FiArrowRightCircle,FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import TicketSubmissionModal from "./TicketSubmissionModal";
import SettingsModal from "./SettingsModel";
import { FaTicketAlt, FaUserCog,FaChartLine } from "react-icons/fa";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(localStorage.getItem("role"));

  const location = useLocation();
  const settingsModalRef = useRef(null);
  const settingsButtonRef = useRef(null);

  useEffect(() => {
    const handleStorageChange = () => {
      setUserRole(localStorage.getItem("role"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleOpenTicketModal = () => setIsTicketModalOpen(true);
  const handleCloseTicketModal = () => setIsTicketModalOpen(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        settingsModalRef.current &&
        !settingsModalRef.current.contains(event.target) &&
        !settingsButtonRef.current.contains(event.target)
      ) {
        setIsSettingsModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        {/* Sidebar Header - Logo and Title */}
        <div className="sidebar-header">
          <img src="/logo_white.png" alt="Logo" className="logo" />
          {sidebarOpen && <span className="sidebar-title">QuickAssist</span>}
          <button className="collapse-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiArrowRightCircle size={24} /> : <FiArrowLeftCircle size={24} />}
          </button>
        </div>

        <ul className="sidebar-list">
          {/* USER ROLE */}
          {userRole === "user" && (
            <>
              <li>
                <Link to="/dashboard" className={`sidebar-item ${location.pathname === "/dashboard" ? "sidebar-item-active" : ""}`}>
                  <FiHome size={20} />
                  {sidebarOpen && <span className="sidebar-item-text">Dashboard</span>}
                </Link>
              </li>
              <li>
                <Link to="/tickets" className={`sidebar-item ${location.pathname === "/tickets" ? "sidebar-item-active" : ""}`}>
                  <FiFileText size={20} />
                  {sidebarOpen && <span className="sidebar-item-text">My Tickets</span>}
                </Link>
              </li>
              <li>
                <button onClick={handleOpenTicketModal} className="sidebar-item w-full">
                  <FiPlusCircle size={20} />
                  {sidebarOpen && <span className="sidebar-item-text">Create Ticket</span>}
                </button>
              </li>
              <li>
                <Link to="/tickets/closed" className={`sidebar-item ${location.pathname === "/tickets/closed" ? "sidebar-item-active" : ""}`}>
                  <FiCheckCircle size={20} />
                  {sidebarOpen && <span className="sidebar-item-text">Closed Tickets</span>}
                </Link>
              </li>
            </>
          )}

          {/* EMPLOYEE ROLE */}
          {userRole === "employee" && (<>
            <li>
              <Link to="/csrdashboard" className={`sidebar-item ${location.pathname === "/csrdashboard" ? "sidebar-item-active" : ""}`}>
                <FiHome size={20} />
                {sidebarOpen && <span className="sidebar-item-text">Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link to="/UserRequest" className={`sidebar-item ${location.pathname === "/UserRequest" ? "sidebar-item-active" : ""}`}>
              <FiUsers size={20} />
                {sidebarOpen && <span className="sidebar-item-text">User Requests</span>}
              </Link>
            </li>
            <li>
              <Link to="/employeeticketlist" className={`sidebar-item ${location.pathname === "/employeeticketlist" ? "sidebar-item-active" : ""}`}>
              <FaTicketAlt size={20} />
                {sidebarOpen && <span className="sidebar-item-text">Assigned Tickets</span>}
              </Link>
            </li>

            </>
          )}

          {/* ADMIN ROLE */}
          {userRole === "admin" && (
            <>
              <li>
                <Link to="/admindashboard" className={`sidebar-item ${location.pathname === "/admindashboard" ? "sidebar-item-active" : ""}`}>
                  <FiHome size={20} />
                  {sidebarOpen && <span className="sidebar-item-text">Dashboard</span>}
                </Link>
              </li>
              <li>
                <Link to="/assigntickets" className={`sidebar-item ${location.pathname === "/assigntickets" ? "sidebar-item-active" : ""}`}>
                  <FiCheckCircle size={20} />
                  {sidebarOpen && <span className="sidebar-item-text">Assign Tickets</span>}
                </Link>
              </li>
              <li>
                <Link to="/managetickets" className={`sidebar-item ${location.pathname === "/managetickets" ? "sidebar-item-active" : ""}`}>
                  <FaTicketAlt size={20} />
                  {sidebarOpen && <span className="sidebar-item-text">Manage Tickets</span>}
                </Link>
              </li>
              <li>
                <Link to="/manageemployee" className={`sidebar-item ${location.pathname === "/manageemployee" ? "sidebar-item-active" : ""}`}>
                  <FaUserCog size={20} />
                  {sidebarOpen && <span className="sidebar-item-text">Manage Employee</span>}
                </Link>
              </li>
              <li>
              <Link
  to="/admin/analytics"
  className={`sidebar-item ${location.pathname === "/admin/analytics" ? "sidebar-item-active" : ""}`}
>
  <FaChartLine size={20} />
  {sidebarOpen && <span className="sidebar-item-text">Analytics</span>}
</Link>

              </li>
              
            </>
          )}
        </ul>

        {/* Settings Button */}
        <div className="sidebar-footer">
          <button ref={settingsButtonRef} onClick={() => setIsSettingsModalOpen(!isSettingsModalOpen)} className="sidebar-item settings-btn">
            <FiSettings size={20} />
            {sidebarOpen && <span className="sidebar-item-text">Settings</span>}
          </button>

          {/* Settings Modal */}
          {isSettingsModalOpen && (
            <div 
              ref={settingsModalRef} 
              className="absolute z-50 bg-blue dark:bg-gray-900 p-4 rounded-lg shadow-lg w-60"
              style={{
                top: settingsButtonRef.current 
                  ? settingsButtonRef.current.getBoundingClientRect().top - 200 + "px"
                  : "0px",
                left: sidebarOpen ? "120px" : "60px",
              }}
            >
              <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
            </div>
          )}
        </div>
      </aside>

      <TicketSubmissionModal isOpen={isTicketModalOpen} onClose={handleCloseTicketModal} />
    </>
  );
};

export default Sidebar;
