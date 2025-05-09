import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Subscription.css";

interface UserInfo {
  user_id: number;
  user_name: string;
  email: string;
  pro_member: boolean;
}

interface Plan {
  name: string;
  price: number;
  description: string[];
  paymentLink: string; // Add Payment Link URL
}

const plans: Plan[] = [
  {
    name: "Basic",
    price: 9.99,
    description: [
      "40 conversations per month",
      "Long term memory",
      "Voice generation",
      "Unlock NSFW image generation",
    ],
    paymentLink: "https://buy.stripe.com/test_5kA8wQcP55v69yg5kk", // Replace with actual Stripe Payment Link
  },
  {
    name: "Intermediate",
    price: 19.99,
    description: [
      "100 conversations per month",
      "Long term memory",
      "Voice generation",
      "Unlock NSFW image generation",
    ],
    paymentLink: "https://buy.stripe.com/test_5kA8wQcP55v69yg5kk", // Replace with actual Stripe Payment Link
  },
  {
    name: "Advanced",
    price: 49.99,
    description: [
      "300 conversations",
      "Long term memory",
      "Voice generation",
      "Customize AI girlfriend",
      "Unlock NSFW image generation",
    ],
    paymentLink: "https://buy.stripe.com/test_5kA8wQcP55v69yg5kk", // Replace with actual Stripe Payment Link
  },
];

function Subscription() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isShowMenu, setIsShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:5000/get-user-info", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Google-Sub": user?.sub || "",
          },
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        setUserInfo(data.user);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Error fetching user data:", error);
        setStatus("Error loading user data");
      }
    };

    fetchUserData();
  }, []);

  const handleSubscribe = (plan: Plan) => {
    setStatus(`Redirecting to payment for ${plan.name} plan...`);
    window.location.href = plan.paymentLink; // Redirect to Stripe Payment Link
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    setStatus("Canceling subscription...");

    try {
      const response = await fetch(
        "http://localhost:5000/cancel-subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Google-Sub": user?.sub || "",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      setUserInfo({ ...userInfo!, pro_member: false });
      setStatus("Subscription canceled successfully!");
    } catch (error) {
      console.error("Error canceling subscription:", error);
      setStatus(
        `Error: ${
          error instanceof Error
            ? error.message
            : "Failed to cancel subscription"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleHome = () => {
    navigate("/");
  };

  const handleDashboard = () => {
    navigate("/dashboard");
  };

  const handlePaymentRecord = () => {
    navigate("/payment-record");
  };

  return (
    <div className="subscription-container">
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
                fill-rule="evenodd"
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
                  viewBox="0 16 16"
                >
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                </svg>
              </a>
            </li>
            <li>
              <a onClick={handleHome}>Home</a>
            </li>
            <li>
              <a onClick={handleDashboard}>Dashboard</a>
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
        <div className="subscription-card">
          <h1 className="subscription-title">
            Subscription Plans {userInfo ? `- ${userInfo.user_name}` : ""}
          </h1>
          {userInfo?.pro_member && (
            <p className="pro-member-status">You are a Pro Member!</p>
          )}
          <div className="plans-container">
            {plans.map((plan) => (
              <div key={plan.name} className="plan-card">
                <h2 className="plan-title">{plan.name}</h2>
                <p className="plan-price">${plan.price}/month</p>
                <ul className="plan-features">
                  {plan.description.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                <button
                  className="subscribe-button"
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading || userInfo?.pro_member}
                >
                  {loading ? "Processing..." : "Subscribe"}
                </button>
              </div>
            ))}
          </div>
          {userInfo?.pro_member && (
            <button
              className="subscribe-button"
              onClick={handleCancelSubscription}
              disabled={loading}
            >
              Cancel Subscription
            </button>
          )}
          {status && <p className="status-message">{status}</p>}
          {loading && (
            <div className="loader-container">
              <div className="circle-loader"></div>
            </div>
          )}
          <button className="subscription-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Subscription;
