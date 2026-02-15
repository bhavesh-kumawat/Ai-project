import { Navigate } from "react-router-dom";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children, guestOnly = false }) => {
  if (!guestOnly) {
    return children;
  }

  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return children;
  }

  return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} replace />;
};

export default ProtectedRoute;
