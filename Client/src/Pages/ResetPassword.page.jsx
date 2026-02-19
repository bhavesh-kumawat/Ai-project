import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { resetPassword } from "../Service/auth.service";
import SpaceCanvas from "../components/loginuifile/SpaceCanvas.component";
import Blobs from "../components/loginuifile/Blobs.component";
import InputField from "../components/loginuifile/InputField.component";
import BackButton from "../components/BackButton";

function ResetPassword() {
    const { token } = useParams();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error("Passwords do not match", { id: "active-toast" });
        }

        if (password.length < 4) {
            return toast.error("Password must be at least 4 characters", { id: "active-toast" });
        }

        try {
            setLoading(true);
            await resetPassword(token, password);
            toast.success("Password reset successful! Please login.", { id: "active-toast" });
            navigate("/login");
        } catch (error) {
            toast.error(error.message || "Failed to reset password", { id: "active-toast" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: "relative",
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                background: "#050816",
            }}
        >
            <BackButton />
            <Blobs />
            <SpaceCanvas />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    position: "relative",
                    zIndex: 10,
                    width: "100%",
                    maxWidth: 420,
                    padding: 32,
                    background: "rgba(8,3,22,0.90)",
                    backdropFilter: "blur(18px)",
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.07)",
                    textAlign: "center",
                }}
            >
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
                    Reset your <span style={{ color: "#a78bfa" }}>password</span>
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>
                    Enter your new password below.
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <InputField
                        icon="◈"
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <InputField
                        icon="◈"
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: 10,
                            padding: "14px 0",
                            borderRadius: 12,
                            border: "none",
                            background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                            color: "#fff",
                            fontWeight: 700,
                            cursor: "pointer",
                            letterSpacing: "0.1em",
                        }}
                    >
                        {loading ? "RESETTING..." : "RESET PASSWORD"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

export default ResetPassword;
