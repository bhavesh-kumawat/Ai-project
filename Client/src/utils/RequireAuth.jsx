import { Navigate, useLocation } from "react-router-dom";

const safeParseUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

const RequireAuth = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = safeParseUser();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RequireAuth;
