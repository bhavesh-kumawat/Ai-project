function Blobs({ isAdmin }) {
  return (
    <>
      <style>{`
        @keyframes blobA{0%,100%{transform:translate(-50%,-50%) scale(1) translate(0,0)}33%{transform:translate(-50%,-50%) scale(1.1) translate(28px,-38px)}66%{transform:translate(-50%,-50%) scale(0.95) translate(-18px,22px)}}
        @keyframes blobB{0%,100%{transform:translate(-50%,-50%) scale(1) translate(0,0)}40%{transform:translate(-50%,-50%) scale(1.07) translate(-30px,22px)}75%{transform:translate(-50%,-50%) scale(0.93) translate(18px,-28px)}}
        @keyframes blobC{0%,100%{transform:translate(-50%,-50%) scale(1) translate(0,0)}50%{transform:translate(-50%,-50%) scale(1.1) translate(22px,30px)}}
        .blob{position:absolute;border-radius:50%;pointer-events:none;will-change:transform;}
        .blob-a{animation:blobA 16s ease-in-out infinite;}
        .blob-b{animation:blobB 21s ease-in-out infinite;}
        .blob-c{animation:blobC 13s ease-in-out infinite;}
      `}</style>
      <div
        className="blob blob-a"
        style={{
          width: 480,
          height: 480,
          left: "12%",
          top: "18%",
          background: `radial-gradient(circle,${isAdmin ? "rgba(220,38,38,0.38)" : "rgba(109,40,217,0.4)"} 0%,transparent 70%)`,
          filter: "blur(52px)",
          transition: "background 1s",
        }}
      />
      <div
        className="blob blob-b"
        style={{
          width: 400,
          height: 400,
          left: "85%",
          top: "76%",
          background: `radial-gradient(circle,${isAdmin ? "rgba(234,88,12,0.3)" : "rgba(6,182,212,0.32)"} 0%,transparent 70%)`,
          filter: "blur(48px)",
          transition: "background 1s",
        }}
      />
      <div
        className="blob blob-c"
        style={{
          width: 280,
          height: 280,
          left: "78%",
          top: "12%",
          background: `radial-gradient(circle,${isAdmin ? "rgba(239,68,68,0.22)" : "rgba(219,39,119,0.25)"} 0%,transparent 70%)`,
          filter: "blur(42px)",
          transition: "background 1s",
        }}
      />
    </>
  );
}

export default Blobs;
