/* =====================================================
   FILE: app/page.tsx
   PURPOSE: Homepage / entry point
   ===================================================== */

   export default function Home() {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "system-ui"
        }}
      >
        <h1 style={{ fontSize: 36, marginBottom: 16 }}>
          What Credit Card Should I Get?
        </h1>
  
        <p style={{ marginBottom: 32, color: "#555" }}>
          Answer 4 simple questions to get personalized recommendations.
        </p>
  
        <a
          href="/wizard"
          style={{
            padding: "14px 28px",
            borderRadius: 10,
            background: "#2563eb",
            color: "white",
            textDecoration: "none",
            fontSize: 18,
            fontWeight: "bold"
          }}
        >
          Start →
        </a>
      </div>
    );
  }
  