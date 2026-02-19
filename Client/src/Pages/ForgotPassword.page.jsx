import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { forgotPassword, verifyOTP, resetPassword } from "../Service/auth.service";
import SpaceCanvas from "../components/loginuifile/SpaceCanvas.component";
import Blobs from "../components/loginuifile/Blobs.component";
import InputField from "../components/loginuifile/InputField.component";
import BackButton from "../components/BackButton";

function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const navigate = useNavigate();

    const startResendTimer = () => {
        setResendTimer(60);
        const timer = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();
        if (!email.includes("@")) {
            return toast.error("Enter a valid email", { id: "active-toast" });
        }
        try {
            setLoading(true);
            const normalizedEmail = email.toLowerCase().trim();
            await forgotPassword(normalizedEmail);
            toast.success("OTP sent! Please check your email.", { id: "active-toast" });
            setStep(2);
            startResendTimer();
        } catch (err) {
            toast.error(err.message || "Failed to send OTP", { id: "active-toast" });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            return toast.error("OTP must be 6 digits", { id: "active-toast" });
        }
        try {
            setLoading(true);
            const normalizedEmail = email.toLowerCase().trim();
            const data = await verifyOTP(normalizedEmail, otp);
            setResetToken(data.resetToken);
            toast.success("OTP verified!", { id: "active-toast" });
            setStep(3);
        } catch (err) {
            toast.error(err.message || "Invalid OTP", { id: "active-toast" });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error("Passwords do not match", { id: "active-toast" });
        }
        if (password.length < 4) {
            return toast.error("Password too short", { id: "active-toast" });
        }
        try {
            setLoading(true);
            await resetPassword(resetToken, password);
            toast.success("Password reset successful!", { id: "active-toast" });
            navigate("/login");
        } catch (err) {
            toast.error(err.message || "Reset failed", { id: "active-toast" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#050816" }}>
            <BackButton />
            <Blobs />
            <SpaceCanvas />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420, padding: 32, background: "rgba(8,3,22,0.90)", backdropFilter: "blur(18px)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)" }}
            >
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Forgot <span style={{ color: "#a78bfa" }}>Password?</span></h2>
                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>Enter your email to receive a 6-digit verification code.</p>
                            <form onSubmit={handleSendOTP} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <InputField icon="◎" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                                <button disabled={loading} style={{ padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{loading ? "SENDING..." : "SEND OTP"}</button>
                            </form>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Verify <span style={{ color: "#a78bfa" }}>OTP</span></h2>
                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>Enter the 6-digit code sent to {email}.</p>
                            <form onSubmit={handleVerifyOTP} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <InputField icon="◈" type="text" placeholder="------" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
                                <button disabled={loading} style={{ padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{loading ? "VERIFYING..." : "VERIFY OTP"}</button>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                                    <p onClick={() => setStep(1)} style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>Wrong email?</p>
                                    {resendTimer > 0 ? (
                                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Resend in {resendTimer}s</p>
                                    ) : (
                                        <p onClick={() => handleSendOTP()} style={{ color: "#a78bfa", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Resend OTP</p>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Set New <span style={{ color: "#a78bfa" }}>Password</span></h2>
                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>Your identity is verified. Choose a strong password.</p>
                            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <InputField icon="◈" type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                                <InputField icon="◈" type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                <button disabled={loading} style={{ padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{loading ? "RESETTING..." : "RESET PASSWORD"}</button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

export default ForgotPassword;
