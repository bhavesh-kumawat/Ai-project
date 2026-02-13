import { useState } from "react";

function InputField({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  accentColor = "rgba(139,92,246,0.75)",
}) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? "rgba(248,113,113,0.8)"
    : focused
      ? accentColor
      : "rgba(255,255,255,0.1)";

  const shadow = error
    ? "0 0 14px rgba(248,113,113,0.2)"
    : focused
      ? `0 0 18px ${accentColor.replace("0.75", "0.22")}`
      : "none";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "13px 16px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.07)",
          border: `1px solid ${borderColor}`,
          boxShadow: shadow,
          transition: "border-color .2s,box-shadow .2s",
        }}
      >
        <span
          style={{
            fontSize: 15,
            userSelect: "none",
            display: "inline-block",
            transition: "transform .2s",
            transform: focused ? "scale(1.2)" : "scale(1)",
          }}
        >
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            background: "transparent",
            color: "#fff",
            outline: "none",
            fontSize: 13,
            fontWeight: 300,
            letterSpacing: "0.04em",
            border: "none",
          }}
        />
      </div>
      {error && (
        <p style={{ color: "rgba(248,113,113,0.9)", fontSize: 11, marginTop: 4, paddingLeft: 4, fontWeight: 300 }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

export default InputField;
