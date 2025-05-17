import { useEffect, useState } from "react";

import Cart from "./user/Cart";
import Dashboard from "./user/Dashboard";
import MyAccount from "./user/MyAccount";
import MyPurchases from "./user/MyPurchases";
import OrderHistory from "./user/OrderHistory";
import Sidebar from "./user/Sidebar";

export default function UserDashboard() {
  // Set the default active page to "dashboard"
  const [activePage, setActivePage] = useState("dashboard");

  // User data state that will be passed to all components
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    profilePic: "/images/default-avatar.png",
  });

  // Fetch user data from localStorage on component mount
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('user_info');
    if (storedUserInfo) {
      const userInfo = JSON.parse(storedUserInfo);
      setUserData({
        fullName: `${userInfo.fname} ${userInfo.lname}`,
        email: userInfo.email,
        profilePic: userInfo.profilePic || "https://cdn1.iconfinder.com/data/icons/mix-color-3/502/Untitled-7-1024.png"
      });
    }
  }, []);

  // Render the appropriate component based on active page
  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard userData={userData} />;
      case "account":
        return <MyAccount userData={userData} setUserData={setUserData} />;
      case "orders":
        return <OrderHistory />;
      case "cart":
        return <Cart />;
      case "purchases":
        return <MyPurchases />;
      default:
        return <Dashboard userData={userData} />;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar
        setActivePage={setActivePage}
        activePage={activePage}
        fullName={userData.fullName}
        profilePic={userData.profilePic}
      />
      <div className="main-content">
        <div className="container-fluid px-4 py-3">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}