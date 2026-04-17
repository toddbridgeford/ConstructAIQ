export default function ComingSoon() {
  return (
    <main style={{
      background: "#0D0F0E", color: "#E8E4DC", minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "monospace", textAlign: "center",
      padding: "40px"
    }}>
      <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#C8A96E", marginBottom: "24px", textTransform: "uppercase" }}>
        Coming Soon
      </div>
      <h1 style={{ fontSize: "clamp(40px, 8vw, 80px)", fontWeight: 900, letterSpacing: "4px", marginBottom: "16px", textTransform: "uppercase" }}>
        ConstructAIQ
      </h1>
      <p style={{ color: "#6A6660", maxWidth: "420px", lineHeight: 1.8, marginBottom: "40px", fontSize: "15px" }}>
        AI-powered construction market intelligence. 312 federal and state data sources unified into forecasts economists and industry leaders can act on.
      </p>
      <form style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}
        action="https://app.resend.com/audiences" method="POST">
        <input type="email" name="email" placeholder="your@email.com" required
          style={{ padding: "12px 20px", background: "#131510", border: "1px solid #1E201C",
            color: "#E8E4DC", borderRadius: "2px", fontSize: "14px", width: "280px" }} />
        <button type="submit"
          style={{ padding: "12px 28px", background: "#C8A96E", color: "#0D0F0E",
            border: "none", fontWeight: 700, fontSize: "12px", letterSpacing: "0.1em",
            textTransform: "uppercase", cursor: "pointer", borderRadius: "2px" }}>
          Get Early Access
        </button>
      </form>
      <div style={{ marginTop: "20px", fontSize: "11px", color: "#3A3830" }}>
        No spam. Launch updates only.
      </div>
    </main>
  );
}
