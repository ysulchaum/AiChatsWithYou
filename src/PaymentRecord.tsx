import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PaymentRecord.css";
import { useUserStore } from "./store/userStore";

function PaymentRecord() {
  const { userInfo, payments, loading, status, fetchUserData, fetchPaymentRecords, clearUserData } =
    useUserStore();
  const [isShowMenu, setIsShowMenu] = useState(false);
  const navigate = useNavigate();

  // Memoize user to ensure stable reference
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const abortController = new AbortController();

    // Fetch data only if not already populated
    const fetchData = async () => {
      if (!userInfo) {
        await fetchUserData(user.sub, abortController.signal);
      }
      if (payments.length === 0) {
        await fetchPaymentRecords(user.sub, abortController.signal);
      }
    };

    fetchData();

    // Cleanup: Abort fetches on unmount
    return () => {
      abortController.abort();
    };
  }, [navigate, user, userInfo, payments, fetchUserData, fetchPaymentRecords]);

  const handleLogout = () => {
    clearUserData(); // Clear user data in store
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleHome = () => {
    navigate("/");
  };

  const handleDashboard = () => {
    navigate("/dashboard");
  };

  const handleSubscription = () => {
    navigate("/subscription");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="payment-record-container">
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
              <a onClick={handleDashboard}>Dashboard</a>
            </li>
            <li>
              <a onClick={handleSubscription}>Subscription</a>
            </li>
            <li>
              <a onClick={handleLogout}>Logout</a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="content-container">
        <div className="payment-record-card">
          <h1 className="payment-record-title">
            Payment Records {userInfo ? `- ${userInfo.user_name}` : ""}
          </h1>
          {loading ? (
            <div className="loader-container">
              <div className="circle-loader"></div>
            </div>
          ) : (
            <>
              {payments.length > 0 ? (
                <div className="payments-table-container">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Plan</th>
                        <th>Price</th>
                        <th>Order ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.payment_id}>
                          <td>{formatDate(payment.timestamp)}</td>
                          <td>{payment.plan}</td>
                          <td>${payment.price.toFixed(2)}</td>
                          <td>{payment.order_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-records">No payment records found</p>
              )}
              {status && <p className="status-message">{status}</p>}
            </>
          )}
          <button className="payment-record-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentRecord;