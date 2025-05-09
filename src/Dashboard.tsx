import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

interface UserInfo {
  user_id: number;
  user_name: string;
  email: string;
  token: number | null;
  pro_member: boolean;
}

function Dashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [conversationCount, setConversationCount] = useState<number>(0);
  const [isShowMenu, setIsShowMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get user from local storage
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user || !user.sub) {
      navigate("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:5000/get-user-info", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Google-Sub": user.sub,
          },
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        setUserInfo(data.user);
        setConversationCount(data.conversationCount);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data. Please try again.");
      }
    };

    fetchUserData();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleHome = () => {
    navigate("/");
  };

  const handleSubscription = () => {
    navigate("/subscription");
  };

  const handlePaymentRecord = () => {
    navigate("/payment-record");
  };

  return (
    <div className="dashboard-container">
      <div className="menu-container">
        <div className="menu-button">
          <a onClick={() => setIsShowMenu(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              fill="currentColor"
              className="bi bi-list"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
              />
            </svg>
          </a>
        </div>
        <nav>
          <ul className={`sidebar ${isShowMenu ? "active" : ""}`}>
            <li>
              <a className="close-menu" onClick={() => setIsShowMenu(false)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-x-lg"
                  viewBox="0 0 16 16"
                >
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                </svg>
              </a>
            </li>
            <li>
              <a onClick={handleHome}>Home</a>
            </li>
            <li>
              <a onClick={handleSubscription}>Subscription</a>
            </li>
            <li>
              <a onClick={handlePaymentRecord}>Payment Record</a>
            </li>
            <li>
              <a onClick={handleLogout}>Logout</a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="content-container">
        <div className="dashboard-card">
          <h1 className="dashboard-title">
            User Dashboard {userInfo ? `- ${userInfo.user_name}` : ""}
          </h1>
          {error ? (
            <div className="error-message">{error}</div>
          ) : userInfo ? (
            <div className="user-info">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{userInfo.user_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{userInfo.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Token:</span>
                <span className="info-value">
                  {userInfo.token || "No token available"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Pro Member:</span>
                <span className="info-value">
                  {userInfo.pro_member ? "Yes" : "No"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Total Conversations:</span>
                <span className="info-value">{conversationCount}</span>
              </div>
            </div>
          ) : (
            <div className="loader-container">
              <div className="circle-loader"></div>
            </div>
          )}
          <button className="dashboard-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;