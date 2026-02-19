import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LoginUI from "../components/loginuifile/LoginUI.component";
import { loginUser } from "../Service/auth.service";
import BackButton from "../components/BackButton";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // 🔐 Handle Login
  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!identifier || !password) {
      return toast.error("Please fill all fields", { id: "active-toast" });
    }

    try {
      setLoading(true);

      const normalizedIdentifier = identifier.toLowerCase().trim();
      const data = await loginUser(normalizedIdentifier, password, rememberMe);

      // Store token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Login successful", { id: "active-toast" });
      setSuccess(true);

    } catch (error) {
      toast.error(error.message || "Login failed", { id: "active-toast" });
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Handle Forgot Password
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  // 🔁 Redirect After Success Animation
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        const user = JSON.parse(localStorage.getItem("user"));

        if (user?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  return (
    <>
      <BackButton />
      <LoginUI
        identifier={identifier}
        password={password}
        rememberMe={rememberMe}
        setIdentifier={setIdentifier}
        setPassword={setPassword}
        setRememberMe={setRememberMe}
        handleSubmit={handleLogin}
        handleForgotPassword={handleForgotPassword}
        loading={loading}
        success={success}
      />
    </>
  );
}

export default Login;
