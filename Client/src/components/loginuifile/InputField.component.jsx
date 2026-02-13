import { useState } from "react";

function InputField({ icon, type, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"14px 16px", borderRadius:12,
        background:"rgba(255,255,255,0.07)",
        border:`1px solid ${focused ? "rgba(139,92,246,0.75)" : "rgba(255,255,255,0.1)"}`,
        boxShadow: focused ? "0 0 18px rgba(139,92,246,0.22)" : "none",
        transition:"border-color .2s, box-shadow .2s",
      }}
    >
      <span style={{ fontSize:15, userSelect:"none", transition:"transform .2s", transform: focused ? "scale(1.2)" : "scale(1)", display:"inline-block" }}>
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
          flex:1, background:"transparent", color:"white", outline:"none",
          fontSize:14, fontWeight:300, letterSpacing:"0.04em", border:"none",
        }}
      />
    </div>
  );
}

export default InputField;
