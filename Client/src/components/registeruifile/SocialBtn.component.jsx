import { useState } from "react";

function SocialBtn({ icon, label, onClick, color }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "11px 0",
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background: hovered ? color : "rgba(255,255,255,0.06)",
        color: hovered ? "#fff" : "rgba(255,255,255,0.5)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.04em",
        outline: "1px solid",
        outlineColor: hovered ? "transparent" : "rgba(255,255,255,0.1)",
        transition: "all .2s",
        transform: hovered ? "scale(1.04)" : "scale(1)",
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 12 }}>{label}</span>
    </button>
  );
}

export default SocialBtn;
