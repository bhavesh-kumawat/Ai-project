import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RegisterUI from "../components/registeruifile/RegisterUI.component";
import api from "../utils/api";
import BackButton from "../components/BackButton";

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;
const ADMIN_ROUTE = import.meta.env.VITE_ADMIN_ROUTE || "/register/admin";

function Register() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = pathname === ADMIN_ROUTE;

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [secretKey, setSecretKey] = useState("");
  const [secretError, setSecretError] = useState("");
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);

  const isAdmin = isAdminRoute && secretUnlocked;

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [success, navigate]);

  useEffect(() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 4) s++;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    setPwStrength(s);
  }, [form.password]);

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key] || errors.general) setErrors((prev) => ({ ...prev, [key]: "", general: "" }));
  };

  const verifySecret = () => {
    if (!ADMIN_SECRET) {
      setSecretError("Admin secret is not configured in Client/.env (VITE_ADMIN_SECRET).");
      return;
    }

    if (secretKey.trim() === ADMIN_SECRET.trim()) {
      setSecretUnlocked(true);
      setSecretError("");
      return;
    }
    setSecretError("Invalid secret key. Access denied.");
    setSecretKey("");
  };

  const validate = () => {
    const next = {};
    if (!form.username.trim()) next.username = "Username is required.";
    else if (form.username.length < 2) next.username = "At least 2 characters.";
    else if (/\s/.test(form.username)) next.username = "No spaces allowed.";

    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Please provide a valid email.";

    if (!form.password) next.password = "Password is required.";
    else if (form.password.length < 4) next.password = "Minimum 4 characters (schema rule).";

    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      const endpoint = isAdmin ? "/auth/register/admin" : "/auth/register";

      const payload = {
        username: form.username.toLowerCase().trim(),
        email: form.email.trim(),
        password: form.password,
        ...(isAdmin && { adminSecret: secretKey.trim() }),
      };

      await api.post(endpoint, payload);
      setSuccess(true);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BackButton />
      <RegisterUI
        form={form}
        setField={setField}
        errors={errors}
        loading={loading}
        success={success}
        pwStrength={pwStrength}
        isAdminRoute={isAdminRoute}
        secretUnlocked={secretUnlocked}
        secretKey={secretKey}
        setSecretKey={(val) => {
          setSecretKey(val);
          setSecretError("");
        }}
        secretError={secretError}
        verifySecret={verifySecret}
        isAdmin={isAdmin}
        handleSubmit={handleSubmit}
      />
    </>
  );
}

export default Register;
