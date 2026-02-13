import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginUI from "../components/loginuifile/LoginUI.component";
import { loginUser } from "../Service/auth.service";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // 🔐 Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(identifier, password);

      // Store token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccess(true);

    } catch (error) {
      alert(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
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
    <LoginUI
      identifier={identifier}
      password={password}
      setIdentifier={setIdentifier}
      setPassword={setPassword}
      handleSubmit={handleLogin}
      loading={loading}
      success={success}
    />
  );
}

export default Login;
