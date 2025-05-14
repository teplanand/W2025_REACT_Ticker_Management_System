import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";
import Dashboard from "./Dashboard"; // Import Dashboard
import "../styles/global.css";

const Home = () => {
  return (
    <div className="home-container">
      <Navbar />
      <div className="main-content">
        <div className="main-content-body">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} /> {/* Render Dashboard */}
            {/* Add other routes inside Home if needed */}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Home;