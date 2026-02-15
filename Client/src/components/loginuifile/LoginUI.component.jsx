import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import InputField from "./InputField.component";
import Blobs from "./Blobs.component";
import SpaceCanvas from "./SpaceCanvas.component";
const _MOTION = motion;

function LoginUI({
  identifier,
  setIdentifier,
  password,
  setPassword,
  handleSubmit,
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
                NEXUS
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
                }}
              >
                <input type="checkbox" />
                Remember me
              </label>

              <span
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
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 10,
                marginTop: 12,
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.76 }}
            >
              {["G", "⌥", "in"].map((label, i) => (
                <button
                  key={i}
                  type="button"
                  className="social-btn"
                  style={{
                    padding: "10px 0",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.42)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </button>
              ))}
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
              <Link to= "/register" style={{ color: "#22d3ee", cursor: "pointer" }}>
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
