function Blobs() {
  return (
    <>
      <style>{`
        @keyframes blobA {
          0%,100% { transform:translate(-50%,-50%) scale(1) translate(0px,0px); }
          33%      { transform:translate(-50%,-50%) scale(1.1) translate(28px,-38px); }
          66%      { transform:translate(-50%,-50%) scale(0.95) translate(-18px,22px); }
        }
        @keyframes blobB {
          0%,100% { transform:translate(-50%,-50%) scale(1) translate(0px,0px); }
          40%      { transform:translate(-50%,-50%) scale(1.07) translate(-30px,22px); }
          75%      { transform:translate(-50%,-50%) scale(0.93) translate(18px,-28px); }
        }
        @keyframes blobC {
          0%,100% { transform:translate(-50%,-50%) scale(1) translate(0px,0px); }
          50%      { transform:translate(-50%,-50%) scale(1.1) translate(22px,30px); }
        }
        .blob { position:absolute; border-radius:50%; pointer-events:none; will-change:transform; }
        .blob-a { animation:blobA 16s ease-in-out infinite; }
        .blob-b { animation:blobB 21s ease-in-out infinite; }
        .blob-c { animation:blobC 13s ease-in-out infinite; }
      `}</style>
      {/* Violet */}
      <div className="blob blob-a" style={{
        width:480, height:480, left:"12%", top:"18%",
        background:"radial-gradient(circle, rgba(109,40,217,0.4) 0%, transparent 70%)",
        filter:"blur(52px)",
      }} />
      {/* Cyan */}
      <div className="blob blob-b" style={{
        width:400, height:400, left:"85%", top:"76%",
        background:"radial-gradient(circle, rgba(6,182,212,0.32) 0%, transparent 70%)",
        filter:"blur(48px)",
      }} />
      {/* Pink */}
      <div className="blob blob-c" style={{
        width:280, height:280, left:"78%", top:"12%",
        background:"radial-gradient(circle, rgba(219,39,119,0.25) 0%, transparent 70%)",
        filter:"blur(42px)",
      }} />
    </>
  );
}

export default Blobs;
