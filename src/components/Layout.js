import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 transition-all duration-300">
        {/* Navbar */}
        <Navbar isCollapsed={isCollapsed} />

        {/* Page Content */}
        <div className="p-6 mt-16">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
