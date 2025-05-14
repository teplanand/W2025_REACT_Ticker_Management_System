import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FiBell, FiMenu, FiUser, FiLogOut, FiSearch } from "react-icons/fi";
import { SiGoogleassistant } from "react-icons/si";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProfileModal from "./ProfileModal";
import SearchModal from "./SearchModal";
import AiAssistantModal from "./AiAssistantModal";

// Default user avatar as inline SVG for reliability
const DefaultAvatar = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
    <FiUser size={24} />
  </div>
);

const Navbar = ({ sidebarOpen }) => {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [aiAssistantModalOpen, setAiAssistantModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState("Guest");
  const [role, setRole] = useState("User");
  const [profilePicture, setProfilePicture] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize the fetchProfileData function to prevent unnecessary re-renders
  const fetchProfileData = useCallback(() => {
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    const storedProfilePicture = localStorage.getItem("profilePicture");

    if (storedUsername) setUsername(storedUsername);
    if (storedRole) setRole(storedRole);
    if (storedProfilePicture) {
      setProfilePicture(storedProfilePicture);
      setAvatarError(false); // Reset error state when new profile picture is set
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Callback function to update Navbar after profile edit
  const handleProfileUpdate = useCallback(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("profilePicture");
    localStorage.setItem("isAuthenticated", "false");

    toast.success("Logged out successfully!", {
      position: "top-center",
      autoClose: 1000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    setTimeout(() => {
      navigate("/");
    }, 1000);
  }, [navigate]);

  const getPageName = useCallback((path) => {
    if (path.startsWith("/ticket/")) return "Ticket Details";

    switch (path) {
      case "/dashboard":
        return "User Dashboard";
      case "/admindashboard":
        return "Admin Dashboard";
      case "/csrdashboard":
        return "Employee Dashboard";
      case "/tickets":
        return "My Tickets";
      case "/settings":
        return "Settings";
      case "/profile":
        return "Profile";
      case "/home":
        return "Home";
      case "/assigntickets":
        return "Assign Tickets";
      case "/managetickets":
        return "Manage Tickets";
      case "/manageemployee":
        return "Manage Employee";
      case "/tickets/closed":
        return "Closed Tickets";
      case "/UserRequest":
        return "User Requests";
      case "/employeeticketlist":
        return "Assigned Tickets";
      case "/admin/analytics":
        return "Analytics Dashboard";
      default:
        return "Page Not Found";
    }
  }, []);

  const pageName = getPageName(location.pathname);

  const handleSearchInputClick = useCallback(() => {
    setSearchModalOpen(true);
  }, []);

  const toggleProfileOpen = useCallback(() => {
    setProfileOpen((prev) => !prev);
    setNotificationsOpen(false);
  }, []);

  const handleImageError = useCallback(() => {
    setAvatarError(true);
  }, []);

  const handleOpenAiAssistant = useCallback(() => {
    setAiAssistantModalOpen(true);
  }, []);

  return (
    <>
      <nav className="navbar flex items-center justify-between px-4 py-2 bg-gray-800 shadow-md fixed top-0 left-0 right-0 z-50">
        {/* Left side with hamburger menu only shown on mobile */}
        <div className="flex items-center md:w-1/4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white md:hidden"
            aria-label="Toggle menu"
          >
            <FiMenu size={24} />
          </button>
        </div>
        
        {/* Page title - centered on all screen sizes */}
        <div className="flex-1 text-center md:w-2/4">
          <div className="page-title text-white font-semibold text-lg truncate">
            {pageName}
          </div>
        </div>

        {/* Navbar right side */}
        <div className="navbar-right flex items-center gap-2 md:gap-4 md:w-1/4 justify-end">
          {/* AI Assistant Button */}
          <button
            onClick={handleOpenAiAssistant}
            className="relative p-2 rounded-full bg-[#113946] hover:bg-[#154b5e] transition-colors duration-300 text-white"
            aria-label="AI Voice Assistant"
            title="AI Voice Assistant"
          >
            <SiGoogleassistant size={20} />
          </button>

          {/* Search input - hidden on small screens */}
          <div className="relative hidden md:flex items-center">
            <FiSearch className="absolute left-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search Tickets"
              onClick={handleSearchInputClick}
              className="bg-gray-700 text-white pl-9 pr-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-34 md:w-auto"
              readOnly
            />
          </div>

          {/* Search icon only for small screens */}
          <button 
            className="md:hidden text-white"
            onClick={handleSearchInputClick}
            aria-label="Search"
          >
            <FiSearch size={20} />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <div className="flex items-center">
              {/* Username and Role (hidden on small screens) */}
              <div className="user-info text-white flex-col items-end hidden md:flex">
                <p className="username font-bold whitespace-nowrap">{username}</p>
                <p className="user-role text-sm text-gray-300 whitespace-nowrap">
                  {role}
                </p>
              </div>
              {/* Profile Picture */}
              <button
                onClick={toggleProfileOpen}
                className="focus:outline-none ml-2"
                aria-label="Open profile menu"
              >
                <div
                  className="rounded-full overflow-hidden flex items-center justify-center bg-gray-600"
                  style={{ width: "40px", height: "40px" }}
                >
                  {profilePicture && !avatarError ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <DefaultAvatar />
                  )}
                </div>
              </button>
            </div>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#FFF2D8] rounded-xl shadow-lg transition-all duration-300 z-[9999]">
                <ul className="py-2">
                  <li
                    className="px-4 py-2 hover:bg-[#EAD7BB] cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      setProfileModalOpen(true);
                      setProfileOpen(false);
                    }}
                  >
                    <FiUser className="text-[#113946]" />
                    <span className="text-sm text-[#113946]">View Profile</span>
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-[#EAD7BB] cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      handleLogout();
                      setProfileOpen(false);
                    }}
                  >
                    <FiLogOut className="text-[#113946]" />
                    <span className="text-sm text-[#113946]">Logout</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu - shown when menu is toggled */}
      {menuOpen && (
        <div className="mobile-menu block md:hidden fixed top-14 left-0 w-full bg-gray-800 text-white p-4 z-40 shadow-md">
          <ul className="flex flex-col space-y-2">
            <li>
              <Link
                to="/dashboard"
                className="block py-2"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/tickets"
                className="block py-2"
                onClick={() => setMenuOpen(false)}
              >
                Tickets
              </Link>
            </li>
            <li>
              <Link
                to="/profile"
                className="block py-2"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
            </li>
            <li>
              <button
                className="block w-full text-left py-2"
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Profile Modal */}
      {profileModalOpen && (
        <ProfileModal
          onClose={() => setProfileModalOpen(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {/* Search Modal */}
      {searchModalOpen && (
        <SearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
        />
      )}

      {/* AI Assistant Modal */}
      {aiAssistantModalOpen && (
        <AiAssistantModal
          isOpen={aiAssistantModalOpen}
          onClose={() => setAiAssistantModalOpen(false)}
        />
      )}
    </>
  );
};

export default React.memo(Navbar);