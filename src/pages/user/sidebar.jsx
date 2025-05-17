"use client"

import "../styles/sidebar.scss"

import { useEffect, useState } from "react"

import Swal from 'sweetalert2'
import axios from 'axios'

// Add keyframes for animations
const keyframes = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

// Add the keyframes to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = keyframes;
  document.head.appendChild(style);
}

const Sidebar = ({ setActivePage, activePage, fullName, profilePic }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showStoreInfo, setShowStoreInfo] = useState(false)
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'SneakerHub',
    store_email: '',
    contact_number: '',
    address: ''
  })

  // Fetch store settings
  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const response = await axios.get('/settings');
        setStoreSettings(response.data);
      } catch (error) {
        console.error('Error fetching store settings:', error);
      }
    };
    fetchStoreSettings();
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.querySelector(".sidebar")
      const burgerBtn = document.querySelector(".burger-btn")

      if (isOpen && sidebar && !sidebar.contains(event.target) && burgerBtn && !burgerBtn.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    // Prevent body scrolling when sidebar is open on mobile
    if (isOpen) {
      document.body.classList.add("sidebar-open")
    } else {
      document.body.classList.remove("sidebar-open")
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.classList.remove("sidebar-open")
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleClick = (page) => {
    setActivePage(page)
    setIsOpen(false)
  }

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_info');
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Logged Out',
          text: 'You have been successfully logged out',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          // Redirect to home page
          window.location.href = '/';
        });
      }
    });
  }

  const toggleStoreInfo = (e) => {
    e.preventDefault();
    setShowStoreInfo(!showStoreInfo);
  };

  // Simple SVG icons
  const icons = {
    user: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
    cart: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
    ),    
    bag: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
    ),
    credit: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
        <line x1="1" y1="10" x2="23" y2="10"></line>
      </svg>
    ),
    logout: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
    ),
    menu: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    ),
    x: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    ),
    dashboard: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    ),
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: icons.dashboard },
    { id: "account", label: "My Account", icon: icons.user },
    { id: "orders", label: "Order History", icon: icons.bag },
    { id: "cart", label: "My Cart", icon: icons.cart },
    { id: "purchases", label: "My Purchases", icon: icons.credit },
  ]
  
  const styles = {
    sidebar: {
      backgroundColor: '#000000',
      boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
      color: '#ffffff'
    },
    mobileHeader: {
      backgroundColor: '#000000',
      borderBottom: '1px solid rgba(255,215,0,0.2)',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    burgerBtn: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#FFD700',
      cursor: 'pointer'
    },
    mobileBrand: {
      color: '#FFD700',
      margin: 0,
      fontSize: '1.5rem',
      fontWeight: 'bold'
    },
    sidebarHeader: {
      padding: '1.5rem',
      borderBottom: '1px solid rgba(255,215,0,0.2)',
      textAlign: 'center'
    },
    profilePic: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      border: '3px solid #FFD700',
      marginBottom: '1rem'
    },
    userName: {
      color: '#ffffff',
      margin: 0,
      fontSize: '1.2rem',
      fontWeight: 'bold'
    },
    brand: {
      padding: '1.5rem',
      borderBottom: '1px solid rgba(255,215,0,0.2)',
      backgroundColor: 'rgba(0, 0, 0, 0.2)'
    },
    storeInfoContainer: {
      width: '100%'
    },
    storeInfoBtn: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'transparent',
      border: 'none',
      padding: '0',
      cursor: 'pointer',
      color: '#FFD700'
    },
    storeName: {
      color: '#FFD700',
      margin: 0,
      fontSize: '1.5rem',
      fontWeight: 'bold'
    },
    chevronIcon: {
      color: '#FFD700',
      fontSize: '1.2rem',
      transition: 'transform 0.3s ease'
    },
    storeInfo: {
      marginTop: '1rem',
      paddingTop: '1rem',
      borderTop: '1px solid rgba(255,215,0,0.2)',
      animation: 'slideDown 0.3s ease',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '4px',
      padding: '1rem',
      maxWidth: '100%',
      wordWrap: 'break-word'
    },
    infoItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.8rem',
      padding: '0.8rem 0',
      color: '#ffffff',
      transition: 'all 0.3s ease',
      '&:hover': {
        backgroundColor: 'rgba(255, 215, 0, 0.1)'
      }
    },
    infoIcon: {
      color: '#FFD700',
      fontSize: '1.1rem',
      minWidth: '1.1rem',
      marginTop: '0.2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    infoText: {
      flex: 1,
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      fontSize: '0.9rem',
      color: '#ffffff',
      lineHeight: '1.4'
    },
    infoLabel: {
      color: '#FFD700',
      fontWeight: 'bold',
      fontSize: '0.8rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.3rem'
    },
    infoValue: {
      color: '#ffffff',
      fontSize: '0.9rem',
      lineHeight: '1.4',
      wordBreak: 'break-word'
    },
    menuList: {
      listStyle: 'none',
      padding: '1rem 0',
      margin: 0
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem 1.5rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: '#ffffff',
      gap: '1rem',
      '&:hover': {
        backgroundColor: 'rgba(255,215,0,0.1)'
      }
    },
    menuItemActive: {
      backgroundColor: 'rgba(255,215,0,0.15)',
      color: '#FFD700',
      borderLeft: '4px solid #FFD700'
    },
    menuIcon: {
      color: '#FFD700',
      display: 'flex',
      alignItems: 'center'
    },
    menuText: {
      fontSize: '1rem',
      fontWeight: '500'
    },
    logoutBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      width: '100%',
      padding: '0.75rem 1.5rem',
      backgroundColor: 'transparent',
      border: 'none',
      borderTop: '1px solid rgba(255,215,0,0.2)',
      color: '#FF6B6B',
      cursor: 'pointer',
      marginTop: 'auto'
    }
  };

  return (
    <>
      {/* Mobile Header with Burger Button */}
      <div className="flex items-center justify-between p-4 md:hidden">
        <div className="flex items-center">
          <button onClick={handleToggle} className="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-2 text-white font-bold">{storeSettings.store_name}</span>
        </div>
      </div>

      {/* Overlay for mobile */}
      <div className={`sidebar-overlay ${isOpen ? "active" : ""}`} onClick={() => setIsOpen(false)}></div>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : ""}`} style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          {profilePic && <img src={profilePic || "/placeholder.svg"} alt="Profile" style={styles.profilePic} />}
          <h3 style={styles.userName}>{fullName || "User"}</h3>
        </div>

        <div style={styles.brand}>
          <div style={styles.storeInfoContainer}>
            <button style={styles.storeInfoBtn} onClick={toggleStoreInfo}>
              <h2 style={styles.storeName}>{storeSettings.store_name || 'SneakerHub'}</h2>
              <span style={{
                ...styles.chevronIcon,
                transform: showStoreInfo ? 'rotate(180deg)' : 'rotate(0)'
              }}>▼</span>
            </button>
            
            {showStoreInfo && (
              <div style={styles.storeInfo}>
                <div style={styles.infoItem}>
                  <i style={styles.infoIcon}>✉</i>
                  <div style={styles.infoText}>
                    <div style={styles.infoLabel}>Email</div>
                    <div style={styles.infoValue}>
                      {storeSettings.store_email || 'Not available'}
                    </div>
                  </div>
                </div>
                <div style={styles.infoItem}>
                  <i style={styles.infoIcon}>📞</i>
                  <div style={styles.infoText}>
                    <div style={styles.infoLabel}>Contact</div>
                    <div style={styles.infoValue}>
                      {storeSettings.contact_number || 'Not available'}
                    </div>
                  </div>
                </div>
                <div style={styles.infoItem}>
                  <i style={styles.infoIcon}>📍</i>
                  <div style={styles.infoText}>
                    <div style={styles.infoLabel}>Address</div>
                    <div style={styles.infoValue}>
                      {storeSettings.address || 'Not available'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <ul style={styles.menuList}>
          {menuItems.map((item) => (
            <li
              key={item.id}
              onClick={() => handleClick(item.id)}
              style={{
                ...styles.menuItem,
                ...(activePage === item.id ? styles.menuItemActive : {})
              }}
            >
              <span style={styles.menuIcon}>{item.icon}</span>
              <span style={styles.menuText}>{item.label}</span>
            </li>
          ))}
        </ul>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          {icons.logout}
          <span>Logout</span>
        </button>
      </div>
    </>
  )
}

export default Sidebar
