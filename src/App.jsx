import "bootstrap/dist/css/bootstrap.min.css";

import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';

import About from "./pages/About";
import AdminDashboard from "./admin/AdminDashboard";
import Developers from "./pages/Developers";
import Footer from "./pages/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Navbar from "./pages/Navbar";
import Products from "./pages/Products";
import React from "react";
import Signup from "./pages/Signup";

// import "./App.scss";



const App = () => {
  return (
    <Router>
      <MainContent />
    </Router>
  );
};

const MainContent = () => {
  const location = useLocation();

  // Show navbar only on these pages
  const showNavbar = location.pathname === '/' || 
                    location.pathname === '/about' || 
                    location.pathname === '/products' || 
                    location.pathname === '/developers' || 
                    location.pathname === '/footer';

  return (
    <div>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={
          <div>
            <Home />
            <About />
            <Products />
            <Developers />
            <Footer />
          </div>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        {/* Add other routes as needed */}
      </Routes>
    </div>
  );
};
export default App;