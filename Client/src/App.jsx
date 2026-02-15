import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home.page";
import Login from "./Pages/Login.page";
import Register from "./Pages/Register.page";
import Dashboard from "./Pages/UserDashboard.page";
import AdminDashboard from "./Pages/AdminDashboard.page";
import RequireAuth from "./utils/RequireAuth";
import ProtectedRoute from "./Pages/ProtectedRoute.comonent";

const App = () => {
  return (
    <div className="bg-black min-h-screen">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/login"
            element={
              <ProtectedRoute guestOnly>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute guestOnly>
                <Register />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register/admin"
            element={
              <ProtectedRoute guestOnly>
                <Register />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <RequireAuth allowedRoles={["user"]}>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAuth allowedRoles={["admin"]}>
                <AdminDashboard />
              </RequireAuth>
            }
          />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
