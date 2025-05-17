"use client"

import { useState, useEffect } from "react"
import "../styles/MyAccount.scss"

const MyAccount = ({ userData, setUserData }) => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })
  const [isLoading, setIsLoading] = useState(false)

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found');
          return;
        }

        // Get user info from localStorage first
        const userInfo = localStorage.getItem('user_info');
        if (userInfo) {
          const parsedUserInfo = JSON.parse(userInfo);
          setFormData(prev => ({
            ...prev,
            fname: parsedUserInfo.fname || "",
            lname: parsedUserInfo.lname || "",
            email: parsedUserInfo.email || "",
            phone: parsedUserInfo.phone || ""
          }));
        }

        // Then fetch from server
        const response = await fetch('http://localhost:3000/profile/current', {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.error('Server response not ok:', response.status);
          return;
        }

        const data = await response.json();
        console.log('Fetched user data:', data);
        
        if (data && data.user) {
          setFormData(prev => ({
            ...prev,
            fname: data.user.fname || prev.fname,
            lname: data.user.lname || prev.lname,
            email: data.user.email || prev.email,
            phone: data.user.phone || prev.phone
          }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Don't set error message immediately to prevent UI disruption
        setTimeout(() => {
          setMessage({
            text: "Unable to refresh user information. Your saved information is shown.",
            type: "warning"
          });
        }, 1000);
      }
    };

    fetchUserData();
  }, []);

  // Simple SVG icons
  const icons = {
    eye: (
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
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    ),
    eyeOff: (
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
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    ),
    save: (
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
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
    ),
    loader: (
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
        className="spinner"
      >
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      </svg>
    ),
  }

  const togglePassword = () => setShowPassword((prev) => !prev)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (!formData.fname || !formData.lname || !formData.email || !formData.phone) {
      setMessage({
        text: "Please fill in all required fields",
        type: "error"
      });
      return false;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setMessage({
        text: "Please enter a valid email address",
        type: "error"
      });
      return false;
    }

    if (formData.newPassword && !formData.currentPassword) {
      setMessage({
        text: "Current password is required to set a new password",
        type: "error"
      });
      return false;
    }

    return true;
  };

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true)
    setMessage({ text: "", type: "" })

    try {
      // First update user info
      const response = await fetch(`http://localhost:3000/profile/${userData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fname: formData.fname,
          lname: formData.lname,
          email: formData.email,
          phone: formData.phone
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to update profile');
      }

      const data = await response.json();

      // If password fields are filled, update password
      if (formData.currentPassword && formData.newPassword) {
        const passwordResponse = await fetch(`http://localhost:3000/profile/${userData.id}/password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword
          }),
        })

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json().catch(() => null);
          throw new Error(errorData?.message || 'Failed to update password');
        }
      }

      // Update the user data in the parent component
      setUserData((prev) => ({
        ...prev,
        ...data.user
      }))

      // Clear password fields after successful update
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: ""
      }))

      setMessage({ 
        text: "Your information has been updated successfully!", 
        type: "success" 
      })
    } catch (error) {
      console.error("Error updating user info:", error)
      setMessage({ 
        text: error.message || "An error occurred. Please try again.", 
        type: "error" 
      })
    } finally {
      setIsLoading(false)
      // Clear error message after 5 seconds, but keep success message
      if (message.type === "error") {
        setTimeout(() => setMessage({ text: "", type: "" }), 5000)
      }
    }
  }

  return (
    <div className="my-account">
      <div className="account-header">
        <h1>My Account</h1>
        <p>Manage your personal information and preferences</p>
      </div>

      <div className="account-card">
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label htmlFor="fname">First Name *</label>
            <input
              type="text"
              id="fname"
              name="fname"
              value={formData.fname}
              onChange={handleChange}
              required
              placeholder="Enter your first name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lname">Last Name *</label>
            <input
              type="text"
              id="lname"
              name="lname"
              value={formData.lname}
              onChange={handleChange}
              required
              placeholder="Enter your last name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              placeholder="Enter your email address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Enter your phone number"
            />
          </div>

          <div className="password-section">
            <h3>Change Password</h3>
            <p className="password-hint">Leave blank if you don't want to change your password</p>
            
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password to change it"
                />
                <button
                  type="button"
                  className="toggle-eye"
                  onClick={togglePassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? icons.eyeOff : icons.eye}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="update-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                {icons.loader}
                Updating...
              </>
            ) : (
              <>
                {icons.save}
                Update Info
              </>
            )}
          </button>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default MyAccount
