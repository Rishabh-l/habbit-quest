import { useState } from "react";
import { registerUser, loginUser } from "./firebase";
import Scene3D from "./components/Scene3D";

const COLORS = {
  bg: "#f8f6ff",
  card: "#ffffff",
  border: "#e8e6f0",
  text: "#2d2b55",
  textDim: "#8884b8",
  accent: "#7c3aed",
  red: "#ef4444",
  purple: "#a78bfa",
};

export default function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email and password required.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        await registerUser(email, password);
      } else {
        await loginUser(email, password);
      }
    } catch (e) {
      const msg = {
        "auth/user-not-found": "No account with that email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/email-already-in-use": "Email already registered.",
        "auth/weak-password": "Password must be 6+ characters.",
        "auth/invalid-email": "Invalid email address.",
        "auth/invalid-credential": "Wrong email or password.",
      }[e.code] ?? e.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div style={{
      minHeight: "100vh",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: COLORS.text,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@600;700&display=swap');
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing:border-box; }
        input,button { font-family:inherit; }
      `}</style>

      <Scene3D mode="auth" />

      <div style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(248,246,255,0.75)",
        backdropFilter: "blur(3px)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32, animation: "slideUp 0.4s ease-out" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28, fontWeight: 700, margin: "0 0 4px",
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            HABIT QUEST
          </h1>
          <p style={{ color: COLORS.textDim, fontSize: 11, margin: 0, letterSpacing: 3 }}>
            LEVEL UP YOUR LIFE
          </p>
        </div>

        <div style={{
          width: "100%", maxWidth: 360,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16, padding: 28,
          boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
          animation: "slideUp 0.5s ease-out",
        }}>
          <div style={{
            display: "flex", background: COLORS.bg, borderRadius: 10,
            padding: 4, marginBottom: 24, border: `1px solid ${COLORS.border}`,
          }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "8px 0", border: "none", borderRadius: 8,
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                letterSpacing: 0.5, transition: "all 0.2s",
                background: mode === m ? COLORS.accent : "transparent",
                color: mode === m ? "#fff" : COLORS.textDim,
                textTransform: "uppercase",
              }}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: COLORS.textDim, display: "block", marginBottom: 6, letterSpacing: 1 }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKey}
              placeholder="you@example.com"
              style={{
                width: "100%", padding: "11px 12px",
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                borderRadius: 8, color: COLORS.text, fontSize: 14,
                outline: "none", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: COLORS.textDim, display: "block", marginBottom: 6, letterSpacing: 1 }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKey}
              placeholder={mode === "register" ? "Min. 6 characters" : "••••••••"}
              style={{
                width: "100%", padding: "11px 12px",
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                borderRadius: 8, color: COLORS.text, fontSize: 14,
                outline: "none", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {error && (
            <div style={{
              background: `${COLORS.red}10`, border: `1px solid ${COLORS.red}30`,
              borderRadius: 8, padding: "10px 12px", marginBottom: 16,
              color: COLORS.red, fontSize: 12,
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: 13,
              background: loading
                ? COLORS.border
                : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`,
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: 0.5, transition: "opacity 0.2s",
              fontFamily: "inherit",
            }}
          >
            {loading ? "..." : mode === "login" ? "⚡ Sign In" : "🚀 Create Account"}
          </button>
        </div>

        <p style={{ color: COLORS.textDim, fontSize: 11, marginTop: 24, textAlign: "center" }}>
          Your habits are saved to your account.
        </p>
      </div>
    </div>
  );
}
