import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import SpaceCanvas from "./SpaceCanvas.component";
import Blobs from "./Blobs.component";
import InputField from "./InputField.component";
import SocialBtn from "../SocialBtn.component";
const _MOTION = motion;

function RegisterUI({
  form,
  setField,
  errors,
  loading,
  success,
  pwStrength,
  isAdminRoute,
  secretUnlocked,
  secretKey,
  setSecretKey,
  secretError,
  verifySecret,
  isAdmin,
  acceptedTerms,
  setAcceptedTerms,
  handleSubmit,
}) {
  const [showSecret, setShowSecret] = useState(false);

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];

  const accent = isAdmin ? "rgba(239,68,68,0.8)" : "rgba(139,92,246,0.75)";
  const gradientBtn = isAdmin ? "linear-gradient(135deg,#dc2626,#ea580c)" : "linear-gradient(135deg,#7c3aed,#06b6d4)";
  const gradientText = isAdmin ? "linear-gradient(90deg,#fca5a5,#fb923c,#fde68a)" : "linear-gradient(90deg,#a78bfa,#22d3ee,#f472b6)";
  const borderGrad = isAdmin
    ? "linear-gradient(135deg,#dc2626,#ea580c,#7c3aed,#dc2626)"
    : "linear-gradient(135deg,#7c3aed,#06b6d4,#ec4899,#7c3aed)";

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#050816", padding: "24px 0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500&family=Syne:wght@600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;}
        ::placeholder{color:rgba(255,255,255,0.26);}
        ::selection{background:rgba(139,92,246,0.4);color:#fff;}
        input:-webkit-autofill,input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 30px transparent inset !important;-webkit-text-fill-color:white !important;transition:background-color 5000s ease-in-out 0s;}
        @keyframes borderSpin{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
        @keyframes shimmer{0%{transform:translateX(-130%);}100%{transform:translateX(230%);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes arrowBounce{0%,100%{transform:translateX(0);}50%{transform:translateX(5px);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
        .reg-btn{position:relative;overflow:hidden;cursor:pointer;transition:transform .15s;}
        .reg-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,0.18) 50%,transparent 70%);animation:shimmer 3s ease-in-out infinite;animation-delay:1s;}
        .reg-btn:hover{transform:scale(1.02);}
        .reg-btn:active{transform:scale(0.97);}
        .spinner{width:20px;height:20px;border:2px solid rgba(255,255,255,0.25);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;}
        .arrow{display:inline-block;animation:arrowBounce 1.6s ease-in-out infinite;}
        .admin-pulse{animation:pulse 2s ease-in-out infinite;}
      `}</style>

      <Blobs isAdmin={isAdmin} />
      <SpaceCanvas />

      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.93 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 440, margin: "0 16px" }}
      >
        <div style={{ position: "absolute", inset: -1, borderRadius: 18, background: borderGrad, backgroundSize: "300% 300%", animation: "borderSpin 5s ease infinite", opacity: 0.72, pointerEvents: "none", transition: "background 1s" }} />

        <div style={{ position: "relative", borderRadius: 18, padding: 32, overflow: "hidden", background: "rgba(8,3,22,0.90)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <AnimatePresence mode="wait">
            {isAdminRoute && !secretUnlocked && (
              <motion.div
                key="secret-gate"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "16px 0" }}
              >
                <div className="admin-pulse" style={{ fontSize: 52 }}>🔐</div>
                <div style={{ textAlign: "center" }}>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
                    Admin Access
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 13, fontWeight: 300 }}>
                    This route is restricted.<br />Enter your secret key to continue.
                  </p>
                </div>

                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 12, background: "rgba(220,38,38,0.1)", border: `1px solid ${secretError ? "rgba(248,113,113,0.8)" : "rgba(220,38,38,0.4)"}` }}>
                    <span style={{ fontSize: 16 }}>🗝️</span>
                    <input
                      type={showSecret ? "text" : "password"}
                      placeholder="Enter admin secret key"
                      value={secretKey}
                      onChange={(e) => {
                        setSecretKey(e.target.value);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && verifySecret()}
                      style={{ flex: 1, background: "transparent", color: "#fff", outline: "none", fontSize: 13, fontWeight: 300, border: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((s) => !s)}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 14, padding: 0 }}
                    >
                      {showSecret ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {secretError && <p style={{ color: "rgba(248,113,113,0.9)", fontSize: 12, paddingLeft: 4 }}>⚠ {secretError}</p>}

                  <button
                    type="button"
                    onClick={verifySecret}
                    className="reg-btn"
                    style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#dc2626,#ea580c)", color: "#fff", fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}
                  >
                    <span style={{ position: "relative", zIndex: 1 }}>Verify Access</span>
                  </button>
                </div>

                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, textAlign: "center", fontWeight: 300 }}>
                  Unauthorized access attempts are logged.
                </p>
              </motion.div>
            )}

            {(!isAdminRoute || secretUnlocked) && !success && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: gradientBtn, color: "#fff", fontSize: 15, fontWeight: 700, transition: "background 1s" }}>
                    {isAdmin ? "🛡" : "✦"}
                  </div>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Syne',sans-serif" }}>
                      {isAdmin ? "Admin Registration" : "Create account"}
                    </p>
                    <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", fontFamily: "'Syne',sans-serif" }}>Skull Bot</p>
                  </div>
                  {isAdmin && (
                    <div style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 999, background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      🔓 ADMIN
                    </div>
                  )}
                </motion.div>

                <motion.div style={{ marginBottom: 22 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1.15 }}>
                    {isAdmin ? "Create admin" : "Join the"}
                    <br />
                    <span style={{ background: gradientText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", transition: "all 1s" }}>
                      {isAdmin ? "account." : "universe."}
                    </span>
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, marginTop: 6, fontWeight: 300 }}>
                    {isAdmin ? "Admin accounts have full platform access." : "Fill in your details to get started."}
                  </p>
                </motion.div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.34 }}>
                    <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 5, paddingLeft: 2 }}>Username</label>
                    <InputField icon="◉" placeholder="e.g. john_doe" value={form.username} onChange={setField("username")} error={errors.username} accentColor={accent} />
                    <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 11, marginTop: 3, paddingLeft: 2 }}>Stored in lowercase · no spaces</p>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.41 }}>
                    <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 5, paddingLeft: 2 }}>Email</label>
                    <InputField icon="◎" type="email" placeholder="you@example.com" value={form.email} onChange={setField("email")} error={errors.email} accentColor={accent} />
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.48 }}>
                    <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 5, paddingLeft: 2 }}>Password</label>
                    <InputField icon="◈" type="password" placeholder="Min 4 characters" value={form.password} onChange={setField("password")} error={errors.password} accentColor={accent} />
                    {form.password.length > 0 && (
                      <div style={{ marginTop: 6, paddingLeft: 2 }}>
                        <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= pwStrength ? strengthColor[pwStrength] : "rgba(255,255,255,0.1)", transition: "background .3s" }} />
                          ))}
                        </div>
                        <p style={{ fontSize: 11, color: strengthColor[pwStrength], fontWeight: 500 }}>{strengthLabel[pwStrength]}</p>
                      </div>
                    )}
                  </motion.div>

                  {!isAdmin && (
                    <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.51 }} style={{ marginBottom: 5 }}>
                      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "6px 2px" }}>
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          style={{ marginTop: 3, accentColor: "#7c3aed", width: 15, height: 15, cursor: "pointer" }}
                        />
                        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.4 }}>
                          I agree to the{" "}
                          <Link to="/privacy-policy" target="_blank" style={{ color: "#a78bfa", textDecoration: "none" }} onClick={e => e.stopPropagation()}>Privacy Policy</Link>
                          {" "}and{" "}
                          <Link to="/cookie-policy" target="_blank" style={{ color: "#a78bfa", textDecoration: "none" }} onClick={e => e.stopPropagation()}>Cookie Policy</Link>.
                        </span>
                      </label>
                      {errors.terms && <p style={{ color: "rgba(248,113,113,0.9)", fontSize: 11, marginTop: 4, paddingLeft: 2 }}>⚠ {errors.terms}</p>}
                    </motion.div>
                  )}

                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="reg-btn"
                      style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: gradientBtn, color: "#fff", fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", transition: "background 1s" }}
                    >
                      <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        {loading ? <div className="spinner" /> : <>{isAdmin ? "Create Admin" : "Create Account"} <span className="arrow">→</span></>}
                      </span>
                    </button>
                  </motion.div>

                  {errors.general && (
                    <p
                      style={{
                        color: "rgba(248,113,113,0.95)",
                        fontSize: 12,
                        background: "rgba(248,113,113,0.08)",
                        border: "1px solid rgba(248,113,113,0.25)",
                        borderRadius: 10,
                        padding: "10px 12px",
                      }}
                    >
                      ⚠ {errors.general}
                    </p>
                  )}

                  <motion.div style={{ display: "flex", alignItems: "center", gap: 12 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                    <span style={{ color: "rgba(255,255,255,0.22)", fontSize: 11, fontWeight: 300 }}>or continue with</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                  </motion.div>

                  <motion.div style={{ display: "flex", flexDirection: "column", gap: 10 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.66 }}>
                    <SocialBtn
                      icon={(
                        <svg width="18" height="18" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                      )}
                      label="Continue with Google"
                      color="rgba(234,67,53,0.25)"
                      onClick={() => {
                        window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/google`;
                      }}
                    />
                  </motion.div>

                  <motion.p style={{ textAlign: "center", color: "rgba(156,163,175,0.65)", fontSize: 13 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.78 }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{ color: "#22d3ee", cursor: "pointer" }}>
                      Sign in
                    </Link>
                  </motion.p>
                </form>
              </motion.div>
            )}

            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.82 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 160, damping: 14 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 0", gap: 16, textAlign: "center" }}
              >
                <div style={{ width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#fff", background: gradientBtn }}>
                  {isAdmin ? "🛡" : "✓"}
                </div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", color: "#fff", fontSize: 24, fontWeight: 800 }}>
                  {isAdmin ? "Admin Created!" : "Account Created!"}
                </h3>
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 20px", width: "100%" }}>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Registered as</p>
                  <p style={{ color: "#a78bfa", fontSize: 14, fontWeight: 500 }}>{form.username.toLowerCase()}</p>
                  <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, marginTop: 2 }}>{form.email}</p>
                  <div style={{ marginTop: 10, display: "inline-block", padding: "4px 14px", borderRadius: 999, background: isAdmin ? "rgba(220,38,38,0.2)" : "rgba(6,182,212,0.18)", color: isAdmin ? "#fca5a5" : "#22d3ee", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {isAdmin ? "🛡 Admin" : "👤 User"}
                  </div>
                </div>
                <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, fontWeight: 300 }}>Redirecting to login...</p>
                <div style={{ width: 192, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    style={{ height: "100%", background: gradientBtn, borderRadius: 999, transition: "background 1s" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default RegisterUI;
