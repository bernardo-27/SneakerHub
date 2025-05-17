import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';

import { Route, BrowserRouter as Router, Routes, useLocation, Navigate, useNavigate } from 'react-router-dom';

import About from "./pages/Home/About";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Developers from "./pages/Home/Developers";
import Footer from "./pages/Home/Footer";
import Home from "./pages/Home/Home";
import Login from "./pages/Home/Login";
import Navbar from "./pages/Home/Navbar";
import Products from "./pages/Home/Products";
import React, { useEffect, useState } from "react";
import Signup from "./pages/Home/Signup";
import Cart from "./pages/user/Cart";
import MyAccount from "./pages/user/MyAccount";
import OrderHistory from "./pages/user/OrderHistory";
import MyPurchases from "./pages/user/MyPurchases";

// Protected Route component
const ProtectedRoute = ({ children, isAdmin = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const storedRole = localStorage.getItem('role');
      
      console.log("ProtectedRoute - Token:", token); // Debug log
      console.log("ProtectedRoute - Role:", storedRole); // Debug log
      console.log("ProtectedRoute - isAdmin prop:", isAdmin); // Debug log
      
      if (token) {
        setIsAuthenticated(true);
        setRole(storedRole);
        
        // Handle role-based redirection
        if (isAdmin && storedRole !== 'admin') {
          console.log("Not an admin, redirecting to dashboard");
          window.location.href = '/dashboard';
          return;
        }
        if (!isAdmin && storedRole === 'admin') {
          console.log("Is admin, redirecting to admin dashboard");
          window.location.href = '/admin/admindashboard';
          return;
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [isAdmin]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("Access granted to route");
  return children;
};

const App = () => {
  return (
    <Router>
      <MainContent />
    </Router>
  );
};

const MainContent = () => {
  const location = useLocation();
  const [role, setRole] = useState(localStorage.getItem('role'));

  // Show navbar only on these pages
  const showNavbar = location.pathname === '/' || 
                    location.pathname === '/about' || 
                    location.pathname === '/products' || 
                    location.pathname === '/developers' || 
                    location.pathname === '/footer';

  // Listen for changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setRole(localStorage.getItem('role'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
        
        {/* User Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="/my-account" element={
          <ProtectedRoute>
            <MyAccount />
          </ProtectedRoute>
        } />
        <Route path="/order-history" element={
          <ProtectedRoute>
            <OrderHistory />
          </ProtectedRoute>
        } />
        <Route path="/my-purchases" element={
          <ProtectedRoute>
            <MyPurchases />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/admindashboard" element={
          <ProtectedRoute isAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/*" element={
          <ProtectedRoute isAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
};

export default App;