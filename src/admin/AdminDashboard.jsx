import "../styles/admindashboard.css";
import "boxicons/css/boxicons.min.css";

import React, { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [sidebarHidden, setSidebarHidden] = useState(window.innerWidth < 768);
  const [searchVisible, setSearchVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  useEffect(() => {
    const handleResize = () => {
      setSidebarHidden(window.innerWidth < 768);
      if (window.innerWidth > 576) {
        setSearchVisible(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className={sidebarHidden ? "sidebar-hidden" : ""}>
      <Sidebar
        sidebarHidden={sidebarHidden}
        setSidebarHidden={setSidebarHidden}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />
      <Content
        searchVisible={searchVisible}
        setSearchVisible={setSearchVisible}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        setSidebarHidden={setSidebarHidden} // Pass setSidebarHidden to Content
      />
    </div>
  );
};

const Sidebar = ({ sidebarHidden, setSidebarHidden, activeMenu, setActiveMenu }) => {
  return (
    <section id="sidebar" className={sidebarHidden ? "hide" : ""}>
      <a href="#" className="brand">
        <i className="bx bxs-smile"></i>
        <span className="text">SneakerhubAdmin</span>
      </a>
      <ul className="side-menu top">
        {["Dashboard", "My Store", "Analytics", "Message", "Team"].map((item) => (
          <li key={item} className={activeMenu === item ? "active" : ""}>
            <a href="#" onClick={() => setActiveMenu(item)}>
              <i className={`bx bxs-${item.toLowerCase().replace(" ", "-")}`}></i>
              <span className="text">{item}</span>
            </a>
          </li>
        ))}
      </ul>
      <ul className="side-menu">
        <li>
          <a href="#" onClick={() => alert("Navigating to Settings...")}>
            <i className="bx bxs-cog"></i>
            <span className="text">Settings</span>
          </a>
        </li>
        <li>
          <a href="#" className="logout" onClick={() => confirm("Are you sure you want to logout?") && alert("Logging out...")}>
            <i className="bx bxs-log-out-circle"></i>
            <span className="text">Logout</span>
          </a>
        </li>
      </ul>
    </section>
  );
};

const Content = ({ searchVisible, setSearchVisible, darkMode, setDarkMode, setSidebarHidden }) => {
  return (
    <section id="content">
      <nav>
        <i className="bx bx-menu" onClick={() => setSidebarHidden((prev) => !prev)}></i>
        <a href="#" className="nav-link">Categories</a>
        <form action="#">
          <div className={`form-input ${searchVisible ? "show" : ""}`}>
            <input type="search" placeholder="Search..." />
            <button type="submit" className="search-btn" onClick={(e) => {
              if (window.innerWidth < 576) {
                e.preventDefault();
                setSearchVisible(!searchVisible);
              }
            }}>
              <i className={`bx ${searchVisible ? "bx-x" : "bx-search"}`}></i>
            </button>
          </div>
        </form>
        <input type="checkbox" id="switch-mode" hidden checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
        <label htmlFor="switch-mode" className="switch-mode"></label>
        <a href="#" className="notification">
          <i className="bx bxs-bell"></i>
          <span className="num">8</span>
        </a>
        <a href="#" className="profile">
          <img src="../assets/images/Sneaker.jpg" alt="Profile" />
        </a>
      </nav>
    </section>
  );
};

export default AdminDashboard;