import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./Pages/Home.page";
import Login from "./Pages/Login.page";
import Register from "./Pages/Register.page";
import Dashboard from "./Pages/UserDashboard.page";
import AdminDashboard from "./Pages/AdminDashboard.page";
import PrivacyPolicy from "./Pages/PrivacyPolicy.page";
import CookiePolicy from "./Pages/CookiePolicy.page";
import RequireAuth from "./utils/RequireAuth";
import ProtectedRoute from "./Pages/ProtectedRoute.comonent";
import ResetPassword from "./Pages/ResetPassword.page";
import ForgotPassword from "./Pages/ForgotPassword.page";

const App = () => {
  return (
    <div className="bg-black min-h-screen">
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 40,
        }}
        containerClassName=""
        toastOptions={{
          // Only show one toast at a time
          duration: 3000,
          style: {
            background: "#1e293b",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />

          <Route
            path="/login"
            element={
              <ProtectedRoute guestOnly>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

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
