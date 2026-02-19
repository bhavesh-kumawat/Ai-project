import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import InputField from "./InputField.component";
import Blobs from "./Blobs.component";
import SpaceCanvas from "./SpaceCanvas.component";
import SocialBtn from "../SocialBtn.component";
const _MOTION = motion;

function LoginUI({
  identifier,
  setIdentifier,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  handleSubmit,
  handleForgotPassword,
  loading,
}) {
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
      {" "}
      <style>{`
@keyframes borderSpin {
  0% { background-position:0% 50%; }
  50% { background-position:100% 50%; }
  100% { background-position:0% 50%; }
}

@keyframes shimmer {
  0% { transform:translateX(-130%); }
  100% { transform:translateX(230%); }
}

@keyframes arrowBounce {
  0%,100% { transform:translateX(0); }
  50% { transform:translateX(5px); }
}

.login-btn {
  position:relative;
  overflow:hidden;
  cursor:pointer;
  transition:transform .15s;
}

.login-btn:hover {
  transform:scale(1.02);
}

.login-btn:active {
  transform:scale(0.97);
}

.login-btn::after {
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(
    110deg,
    transparent 30%,
    rgba(255,255,255,0.18) 50%,
    transparent 70%
  );
  animation:shimmer 3s ease-in-out infinite;
  animation-delay:1s;
}

.social-btn {
  transition: transform .15s, background .15s;
  cursor:pointer;
}

.social-btn:hover {
  transform:scale(1.06);
}

.social-btn:active {
  transform:scale(0.94);
}

.arrow {
  display:inline-block;
  animation:arrowBounce 1.6s ease-in-out infinite;
}
`}</style>
      {/* Background */}
      <Blobs />
      <SpaceCanvas />
      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.93 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7 }}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 420,
          margin: "0 16px",
        }}
      >
        {/* Animated border */}
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: 18,
            background:
              "linear-gradient(135deg,#7c3aed,#06b6d4,#ec4899,#7c3aed)",
            backgroundSize: "300% 300%",
            animation: "borderSpin 5s ease infinite",
            opacity: 0.72,
          }}
        />

        {/* Glass panel */}
        <div
          style={{
            position: "relative",
            borderRadius: 18,
            padding: 32,
            background: "rgba(8,3,22,0.90)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* BRAND SECTION */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              ✦
            </div>

            <div>
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                }}
              >
                Welcome back
              </p>

              <p
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                }}
              >
                Skull Bot
              </p>
            </div>
          </div>

          {/* HEADING */}
          <div style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.15,
              }}
            >
              Sign in to
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg,#a78bfa,#22d3ee,#f472b6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                your space.
              </span>
            </h2>

            <p
              style={{
                color: "rgba(255,255,255,0.28)",
                fontSize: 13,
                marginTop: 8,
              }}
            >
              Enter your credentials to continue.
            </p>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <InputField
              icon="◎"
              type="text"
              placeholder="Email or Username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />

            <InputField
              icon="◈"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Remember + Forgot */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                Remember me
              </label>

              <span
                onClick={handleForgotPassword}
                style={{
                  fontSize: 12,
                  color: "rgba(34,211,238,0.65)",
                  cursor: "pointer",
                }}
              >
                Forgot password?
              </span>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="login-btn"
              style={{
                padding: "14px 0",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                color: "#fff",
                fontWeight: 700,
                letterSpacing: "0.16em",
              }}
            >
              {loading ? (
                "Loading..."
              ) : (
                <>
                  LOGIN <span className="arrow">→</span>
                </>
              )}
            </button>

            {/* Divider */}
            <motion.div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 10,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255,255,255,0.1)",
                }}
              />
              <span
                style={{
                  color: "rgba(255,255,255,0.22)",
                  fontSize: 11,
                  fontWeight: 300,
                }}
              >
                or continue with
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255,255,255,0.1)",
                }}
              />
            </motion.div>

            {/* Social buttons */}
            <motion.div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 12,
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.76 }}
            >
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

            {/* Sign up */}
            <motion.p
              style={{
                textAlign: "center",
                color: "rgba(156,163,175,0.65)",
                fontSize: 13,
                paddingTop: 14,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.82 }}
            >
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "#22d3ee", cursor: "pointer" }}>
                Sign up
              </Link>
            </motion.p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
export default LoginUI;
