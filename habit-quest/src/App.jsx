import { useState, useEffect, useCallback, useRef } from "react";
import AuthScreen from "./AuthScreen";
import Scene3D from "./components/Scene3D";
import { onAuthChange, logoutUser, loadUserData, saveUserData } from "./firebase";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getLevelInfo(xp) {
  const level = Math.floor(xp / 100) + 1;
  const currentLevelXp = xp % 100;
  const titles = ["Nebula", "Comet", "Meteor", "Star", "Giant", "Supernova", "Quasar", "Pulsar", "Blackhole", "Singularity"];
  return { level, currentLevelXp, nextLevelXp: 100, title: titles[Math.min(level - 1, titles.length - 1)] };
}

const HABIT_ICONS = ["💪", "📖", "🧘", "💧", "🏃", "😴", "🍎", "✍️", "🎯", "🧠", "🎵", "💊", "🚶", "📵", "🌅"];

const initialHabits = [
  { id: 1, name: "Exercise", icon: "💪", frequency: "daily", color: "#a78bfa" },
  { id: 2, name: "Read 30 min", icon: "📖", frequency: "daily", color: "#60a5fa" },
  { id: 3, name: "Meditate", icon: "🧘", frequency: "daily", color: "#10b981" },
  { id: 4, name: "Drink 8 glasses", icon: "💧", frequency: "daily", color: "#38bdf8" },
  { id: 5, name: "Sleep 8 hrs", icon: "😴", frequency: "daily", color: "#f472b6" },
];

const COLORS = {
  text: "rgba(255,255,255,0.92)",
  textDim: "rgba(255,255,255,0.45)",
  border: "rgba(255,255,255,0.12)",
  card: "rgba(255,255,255,0.04)",
  accent: "#a78bfa",
  blue: "#60a5fa",
  green: "#34d399",
  red: "#f87171",
  yellow: "#fbbf24",
  pink: "#f472b6",
};

const card = {
  background: "rgba(15,5,40,0.6)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
};

function HabitCard({ habit, done, streak, onToggle, onEdit, index }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);

  function handleMouseMove(e) {
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -8, y: dx * 8 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setHovered(true)}
      onClick={onToggle}
      style={{
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${hovered ? "6px" : "0px"})`,
        transition: hovered ? "transform 0.1s ease" : "transform 0.4s ease",
        transformStyle: "preserve-3d",
        position: "relative",
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px",
        borderRadius: 16,
        marginBottom: 10,
        cursor: "pointer",
        background: done
          ? `linear-gradient(135deg, ${habit.color}22, ${habit.color}0a)`
          : "rgba(255,255,255,0.05)",
        border: `1px solid ${done ? habit.color + "60" : "rgba(255,255,255,0.12)"}`,
        borderLeft: `3px solid ${habit.color}60`,
        boxShadow: done
          ? `0 0 20px ${habit.color}30, inset 0 1px 0 rgba(255,255,255,0.1)`
          : hovered
            ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
            : "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        animation: `cardIn ${0.3 + index * 0.07}s ease-out both`,
      }}
    >
      <div style={{
        position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
        background: `linear-gradient(${105 + tilt.y * 5}deg, rgba(255,255,255,0.06) 0%, transparent 60%)`,
        opacity: hovered ? 1 : 0.3, transition: "opacity 0.2s",
      }} />

      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
        background: done ? `${habit.color}30` : "rgba(255,255,255,0.06)",
        border: `1.5px solid ${done ? habit.color + "80" : "rgba(255,255,255,0.12)"}`,
        boxShadow: done ? `0 0 16px ${habit.color}50` : "none",
        transition: "all 0.3s",
        transform: "translateZ(8px)",
      }}>
        {done ? "✅" : habit.icon}
      </div>

      <div style={{ flex: 1, transform: "translateZ(4px)" }}>
        <div style={{
          fontSize: 14, fontWeight: 600, letterSpacing: 0.3,
          textDecoration: done ? "line-through" : "none",
          color: done ? COLORS.textDim : COLORS.text,
        }}>{habit.name}</div>
        {streak > 0 && (
          <div style={{ fontSize: 11, color: COLORS.yellow, marginTop: 3 }}>
            🔥 {streak} day streak
          </div>
        )}
      </div>

      <div style={{
        fontSize: 10, color: habit.color, background: `${habit.color}12`,
        border: `1px solid ${habit.color}30`,
        padding: "3px 8px", borderRadius: 8, fontWeight: 700, letterSpacing: 0.5,
        transform: "translateZ(6px)",
      }}>+10 XP</div>

      <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{
        background: "none", border: "none", color: COLORS.textDim,
        cursor: "pointer", fontSize: 18, padding: 4,
        transform: "translateZ(6px)",
      }}>⋮</button>
    </div>
  );
}

function XpOrb({ xp, levelInfo }) {
  const canvasRef = useRef(null);
  const pct = levelInfo.currentLevelXp / levelInfo.nextLevelXp;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = 100;
    const H = canvas.height = 100;
    let animId, t = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, R = 38;
      t += 0.02;

      // Dark background circle
      ctx.beginPath();
      ctx.arc(cx, cy, R + 16, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(10,3,30,0.6)";
      ctx.fill();

      const glow = ctx.createRadialGradient(cx, cy, R - 2, cx, cy, R + 14);
      glow.addColorStop(0, "rgba(167,139,250,0.5)");
      glow.addColorStop(1, "rgba(167,139,250,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, R + 14, 0, Math.PI * 2); ctx.fill();

      const body = ctx.createRadialGradient(cx - 10, cy - 12, 4, cx, cy, R);
      body.addColorStop(0, "#c4b5fd");
      body.addColorStop(0.4, "#7c3aed");
      body.addColorStop(1, "#1e0a3c");
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = body; ctx.fill();

      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + pct * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R + 5, startAngle, endAngle);
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, R + 5, endAngle, startAngle + Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const ringPct = (Math.sin(t) + 1) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R + 8 + ringPct * 6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(167,139,250,${0.15 * (1 - ringPct)})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      const shine = ctx.createRadialGradient(cx - 12, cy - 14, 0, cx - 8, cy - 10, 18);
      shine.addColorStop(0, "rgba(255,255,255,0.35)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = shine; ctx.fill();

      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animId);
  }, [pct]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <canvas ref={canvasRef} style={{ width: 100, height: 100 }} />
      <div style={{ fontSize: 10, color: "rgba(167,139,250,0.8)", letterSpacing: 1, fontWeight: 600 }}>
        {levelInfo.currentLevelXp}/{levelInfo.nextLevelXp} XP
      </div>
    </div>
  );
}

function ConfettiParticle({ x, y, color, delay }) {
  return (
    <div style={{
      position: "fixed", left: x, top: y, width: 8, height: 8,
      backgroundColor: color, borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      animation: `confettiFall 1.5s ease-out ${delay}s forwards`,
      zIndex: 9999, pointerEvents: "none",
    }} />
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthChange(u => setUser(u ?? null));
    return unsub;
  }, []);

  const [habits, setHabits] = useState(initialHabits);
  const [completions, setCompletions] = useState({});
  const [xp, setXp] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [view, setView] = useState("today");
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", icon: "💪", frequency: "daily", color: "#a78bfa" });
  const [confetti, setConfetti] = useState([]);
  const [editingHabit, setEditingHabit] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [burstTrigger, setBurstTrigger] = useState(0);
  const confettiTimeout = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!user) { setDataLoaded(false); return; }
    loadUserData(user.uid).then(data => {
      if (data) {
        if (data.habits) setHabits(data.habits);
        if (data.completions) setCompletions(data.completions);
        if (data.xp !== undefined) setXp(data.xp);
      }
      setDataLoaded(true);
    });
  }, [user]);

  const saveData = useCallback((h, c, x) => {
    if (!user) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveUserData(user.uid, { habits: h, completions: c, xp: x });
    }, 800);
  }, [user]);

  const triggerConfetti = useCallback(() => {
    const particles = Array.from({ length: 35 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * window.innerWidth,
      y: -20,
      color: ["#a78bfa", "#60a5fa", "#10b981", "#f472b6", "#f59e0b", "#38bdf8"][Math.floor(Math.random() * 6)],
      delay: Math.random() * 0.5,
    }));
    setConfetti(particles);
    if (confettiTimeout.current) clearTimeout(confettiTimeout.current);
    confettiTimeout.current = setTimeout(() => setConfetti([]), 2500);
  }, []);

  const toggleCompletion = useCallback((habitId, date) => {
    const key = `${habitId}-${date}`;
    setCompletions(prev => {
      const next = { ...prev };
      let newXp = xp;
      if (next[key]) { delete next[key]; newXp = Math.max(0, newXp - 10); }
      else { next[key] = true; newXp += 10; triggerConfetti(); setBurstTrigger(t => t + 1); }
      setXp(newXp);
      saveData(habits, next, newXp);
      return next;
    });
  }, [habits, xp, saveData, triggerConfetti]);

  const getStreak = useCallback((habitId) => {
    let streak = 0, d = new Date();
    while (true) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (completions[`${habitId}-${dateStr}`]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }, [completions]);

  const addHabit = useCallback(() => {
    if (!newHabit.name.trim()) return;
    const h = [...habits, { ...newHabit, id: Date.now(), name: newHabit.name.trim() }];
    setHabits(h);
    setNewHabit({ name: "", icon: "💪", frequency: "daily", color: "#a78bfa" });
    setShowAdd(false);
    saveData(h, completions, xp);
  }, [newHabit, habits, completions, xp, saveData]);

  const deleteHabit = useCallback((id) => {
    const h = habits.filter(x => x.id !== id);
    setHabits(h);
    setEditingHabit(null);
    saveData(h, completions, xp);
  }, [habits, completions, xp, saveData]);

  const resetAll = useCallback(() => {
    setHabits(initialHabits); setCompletions({}); setXp(0);
    if (user) saveUserData(user.uid, { habits: initialHabits, completions: {}, xp: 0 });
  }, [user]);

  if (user === undefined) return (
    <div style={{ minHeight: "100vh", background: "#060212", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.accent, fontFamily: "monospace" }}>
      ✦ Loading...
    </div>
  );
  if (!user) return <AuthScreen />;
  if (!dataLoaded) return (
    <div style={{ minHeight: "100vh", background: "#060212", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.accent, fontFamily: "monospace" }}>
      ✦ Loading your quests...
    </div>
  );

  const today = getToday();
  const weekDates = getWeekDates();
  const levelInfo = getLevelInfo(xp);
  const todayHabits = habits.filter(h => h.frequency === "daily");
  const todayDone = todayHabits.filter(h => completions[`${h.id}-${today}`]).length;
  const todayTotal = todayHabits.length;
  const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'JetBrains Mono','Fira Code',monospace", color: COLORS.text, background: "#060212", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        html, body { background: #060212; margin: 0; }
        @keyframes confettiFall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
        @keyframes cardIn { from{opacity:0;transform:perspective(600px) translateY(20px) rotateX(-8deg)} to{opacity:1;transform:perspective(600px) translateY(0) rotateX(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes shimmer { from{background-position:200% center} to{background-position:-200% center} }
        * { box-sizing:border-box; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.1) transparent; }
        input,button { font-family:inherit; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
      `}</style>

      <Scene3D xp={xp} burstTrigger={burstTrigger} />

      {confetti.map(p => <ConfettiParticle key={p.id} {...p} />)}

      <div style={{
        height: "100vh",
        overflowY: "auto",
        position: "relative",
        zIndex: 1,
        background: "transparent",
      }}>
        <div style={{ maxWidth: 540, margin: "0 auto", padding: "20px 24px 100px" }}>

          <div style={{ textAlign: "center", marginBottom: 28, position: "relative" }}>
            <div style={{ fontSize: 11, color: "rgba(167,139,250,0.7)", letterSpacing: 4, marginBottom: 6 }}>
              ✦ COSMIC QUEST ✦
            </div>
            <h1 style={{
              fontFamily: "'Space Grotesk',sans-serif", fontSize: 32, fontWeight: 700, margin: "0 0 2px",
              textShadow: "0 0 20px rgba(167,139,250,0.5)",
              background: "linear-gradient(135deg, #e0d7ff 0%, #a78bfa 40%, #60a5fa 70%, #c4b5fd 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "shimmer 4s linear infinite",
            }}>
              ⚡ HABIT QUEST
            </h1>
            <p style={{ color: COLORS.textDim, fontSize: 11, margin: 0, letterSpacing: 3 }}>LEVEL UP YOUR LIFE</p>
            <button onClick={logoutUser} style={{
              position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8, color: COLORS.textDim, fontSize: 11, padding: "6px 10px",
              cursor: "pointer", letterSpacing: 0.5, transition: "all 0.2s",
            }}>logout</button>
          </div>

          <div style={{ ...card, padding: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ animation: "float 4s ease-in-out infinite" }}>
              <XpOrb xp={xp} levelInfo={levelInfo} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 700 }}>Lv.{levelInfo.level}</span>
                <span style={{
                  fontSize: 13, fontWeight: 600, color: COLORS.accent,
                  background: `${COLORS.accent}18`, border: `1px solid ${COLORS.accent}40`,
                  padding: "2px 10px", borderRadius: 20,
                }}>{levelInfo.title}</span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 10 }}>
                ⭐ {xp} total XP earned
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, height: 8, overflow: "hidden", position: "relative" }}>
                <div style={{
                  height: "100%", borderRadius: 8,
                  width: `${(levelInfo.currentLevelXp / levelInfo.nextLevelXp) * 100}%`,
                  background: "linear-gradient(90deg, #7c3aed, #a78bfa, #60a5fa)",
                  backgroundSize: "200% auto",
                  animation: "shimmer 2s linear infinite",
                  transition: "width 0.6s ease",
                  boxShadow: "0 0 12px rgba(167,139,250,0.6)",
                }} />
              </div>
              <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 5, textAlign: "right" }}>
                {levelInfo.currentLevelXp}/{levelInfo.nextLevelXp} to next level
              </div>
            </div>
          </div>

          {view === "today" && (
            <div style={{ background: "rgba(10,3,30,0.5)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", width: 70, height: 70, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: 70, height: 70, transform: "rotate(-90deg)", filter: todayPct === 100 ? "drop-shadow(0 0 8px rgba(52,211,153,0.5))" : "drop-shadow(0 0 6px rgba(167,139,250,0.5))" }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke={todayPct === 100 ? COLORS.green : COLORS.accent} strokeWidth="3"
                    strokeDasharray={`${todayPct}, 100`} style={{ transition: "stroke-dasharray 0.8s ease" }} />
                </svg>
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700, color: todayPct === 100 ? COLORS.green : COLORS.text,
                }}>{todayPct}%</div>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Today's Progress</div>
                <div style={{ color: COLORS.textDim, fontSize: 13, marginTop: 3 }}>{todayDone}/{todayTotal} quests done</div>
                {todayPct === 100 && (
                  <div style={{ color: COLORS.green, fontSize: 12, marginTop: 5, fontWeight: 600, animation: "pulse 1.5s infinite" }}>
                    🌟 Perfect day, hero!
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ background: "rgba(10,3,30,0.6)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)", display: "flex", gap: 4, marginBottom: 16, padding: 4 }}>
            {[{ key: "today", label: "Today" }, { key: "week", label: "Week" }, { key: "month", label: "Month" }, { key: "stats", label: "Stats" }].map(tab => (
              <button key={tab.key} onClick={() => setView(tab.key)} style={{
                flex: 1, padding: "9px 0", border: "none", borderRadius: 12, cursor: "pointer",
                fontSize: 12, fontWeight: 600, letterSpacing: 0.5, transition: "all 0.2s",
                background: view === tab.key
                  ? "linear-gradient(135deg, #7c3aed, #a78bfa)"
                  : "transparent",
                color: view === tab.key ? "#fff" : "rgba(255,255,255,0.5)",
                boxShadow: view === tab.key ? "0 2px 12px rgba(167,139,250,0.4)" : "none",
              }}>{tab.label}</button>
            ))}
          </div>

          {view === "today" && (
            <div>
              {todayHabits.map((habit, i) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  done={!!completions[`${habit.id}-${today}`]}
                  streak={getStreak(habit.id)}
                  onToggle={() => toggleCompletion(habit.id, today)}
                  onEdit={() => setEditingHabit(habit)}
                  index={i}
                />
              ))}
            </div>
          )}

          {view === "week" && (
            <div style={{ ...card, padding: 16, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8, color: COLORS.textDim, fontWeight: 500 }}>Habit</th>
                    {DAYS.map((d, i) => (
                      <th key={d} style={{
                        padding: 8, fontSize: 11, fontWeight: weekDates[i] === today ? 700 : 500,
                        color: weekDates[i] === today ? COLORS.accent : COLORS.textDim,
                      }}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {habits.filter(h => h.frequency === "daily").map(habit => (
                    <tr key={habit.id}>
                      <td style={{ padding: 8, fontSize: 13 }}>{habit.icon} {habit.name}</td>
                      {weekDates.map(date => {
                        const done = completions[`${habit.id}-${date}`];
                        return (
                          <td key={date} style={{ padding: 4, textAlign: "center" }}>
                            <button onClick={() => toggleCompletion(habit.id, date)} style={{
                              width: 28, height: 28, borderRadius: 8,
                              border: `1.5px solid ${done ? habit.color : "rgba(255,255,255,0.12)"}`,
                              background: done ? `${habit.color}35` : "transparent",
                              cursor: "pointer", fontSize: 13, color: done ? "#fff" : "transparent",
                              boxShadow: done ? `0 0 8px ${habit.color}40` : "none",
                              transition: "all 0.2s", margin: "0 auto", display: "flex",
                              alignItems: "center", justifyContent: "center",
                            }}>{done ? "✓" : ""}</button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "month" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <button onClick={() => { if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); } else setSelectedMonth(m => m - 1); }}
                  style={{ ...card, color: COLORS.text, borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>◀</button>
                <span style={{ fontWeight: 600 }}>{MONTHS[selectedMonth]} {selectedYear}</span>
                <button onClick={() => { if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); } else setSelectedMonth(m => m + 1); }}
                  style={{ ...card, color: COLORS.text, borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>▶</button>
              </div>
              {habits.filter(h => h.frequency === "daily").map(habit => {
                const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
                const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                const doneCount = days.filter(d => completions[`${habit.id}-${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`]).length;
                return (
                  <div key={habit.id} style={{ ...card, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{habit.icon} {habit.name}</span>
                      <span style={{ fontSize: 11, color: COLORS.green }}>{doneCount}/{daysInMonth} ({Math.round(doneCount / daysInMonth * 100)}%)</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {days.map(d => {
                        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                        const done = completions[`${habit.id}-${dateStr}`];
                        const isToday = dateStr === today;
                        return (
                          <div key={d} onClick={() => toggleCompletion(habit.id, dateStr)} style={{
                            width: 22, height: 22, borderRadius: 4, fontSize: 9,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: done ? `${habit.color}50` : "rgba(255,255,255,0.04)",
                            border: isToday ? `2px solid ${COLORS.accent}` : `1px solid ${done ? habit.color + "50" : "rgba(255,255,255,0.1)"}`,
                            color: done ? "#fff" : COLORS.textDim, cursor: "pointer",
                            fontWeight: isToday ? 700 : 400, transition: "all 0.15s",
                            boxShadow: done ? `0 0 6px ${habit.color}40` : "none",
                          }}>{d}</div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === "stats" && (
            <div>
              {habits.filter(h => h.frequency === "daily").map(habit => {
                const streak = getStreak(habit.id);
                const last30 = Array.from({ length: 30 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (29 - i));
                  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  return completions[`${habit.id}-${dateStr}`] ? 1 : 0;
                });
                const rate = Math.round((last30.filter(x => x).length / 30) * 100);
                return (
                  <div key={habit.id} style={{ ...card, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{habit.icon} {habit.name}</span>
                      <span style={{ color: COLORS.yellow, fontSize: 12 }}>🔥 {streak}d</span>
                    </div>
                    <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                      {last30.map((v, i) => (
                        <div key={i} style={{
                          flex: 1, height: 22, borderRadius: 3,
                          background: v ? `${habit.color}70` : "rgba(255,255,255,0.05)",
                          border: `1px solid ${v ? habit.color + "50" : "rgba(255,255,255,0.06)"}`,
                          boxShadow: v ? `0 0 4px ${habit.color}40` : "none",
                        }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: COLORS.textDim }}>Last 30 days</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: rate >= 80 ? COLORS.green : rate >= 50 ? COLORS.yellow : COLORS.red }}>
                        {rate}%
                      </span>
                    </div>
                  </div>
                );
              })}

              <div style={{ ...card, padding: 18, marginTop: 8 }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 14, color: COLORS.accent }}>
                  ✦ Overall Stats
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Total XP", value: `⭐ ${xp}`, color: COLORS.yellow },
                    { label: "Level", value: `Lv.${levelInfo.level}`, color: COLORS.accent },
                    { label: "Habits", value: habits.length, color: COLORS.blue },
                    { label: "Completions", value: Object.keys(completions).length, color: COLORS.green },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 14,
                      textAlign: "center", border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 5 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={resetAll} style={{
                width: "100%", marginTop: 16, padding: 12, background: "rgba(248,113,113,0.06)",
                border: "1px solid rgba(248,113,113,0.25)", borderRadius: 12, color: COLORS.red,
                cursor: "pointer", fontSize: 12, fontWeight: 600,
              }}>🗑 Reset All Data</button>
            </div>
          )}
        </div>
      </div>

      <button onClick={() => setShowAdd(true)} style={{
        position: "fixed", bottom: 28, right: 28, width: 58, height: 58, borderRadius: "50%",
        background: "linear-gradient(135deg, #7c3aed, #a78bfa, #60a5fa)",
        backgroundSize: "200% auto", animation: "shimmer 3s linear infinite",
        border: "none", color: "#fff", fontSize: 30, cursor: "pointer",
        boxShadow: "0 0 24px rgba(167,139,250,0.5), 0 4px 16px rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
        transition: "transform 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.12)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >+</button>

      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
        }} onClick={() => setShowAdd(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "rgba(10,3,30,0.85)", border: `1px solid rgba(167,139,250,0.3)`, borderRadius: 16,
            boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
            padding: 24, width: "100%", maxWidth: 400,
          }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 18px", fontSize: 18, color: COLORS.accent }}>
              ✦ New Quest
            </h3>
            <input value={newHabit.name} onChange={e => setNewHabit(p => ({ ...p, name: e.target.value }))}
              placeholder="Quest name..." style={{
                width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
                color: COLORS.text, fontSize: 14, marginBottom: 14, outline: "none",
              }} />
            <label style={{ fontSize: 11, color: COLORS.textDim, display: "block", marginBottom: 8, letterSpacing: 1 }}>ICON</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {HABIT_ICONS.map(icon => (
                <button key={icon} onClick={() => setNewHabit(p => ({ ...p, icon }))} style={{
                  width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: "pointer",
                  border: `1.5px solid ${newHabit.icon === icon ? COLORS.accent : "rgba(255,255,255,0.12)"}`,
                  background: newHabit.icon === icon ? `${COLORS.accent}25` : "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: newHabit.icon === icon ? `0 0 10px ${COLORS.accent}50` : "none",
                }}>{icon}</button>
              ))}
            </div>
            <label style={{ fontSize: 11, color: COLORS.textDim, display: "block", marginBottom: 8, letterSpacing: 1 }}>COLOR</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["#a78bfa", "#60a5fa", "#10b981", "#f472b6", "#f59e0b", "#38bdf8", "#ef4444", "#fb923c"].map(c => (
                <button key={c} onClick={() => setNewHabit(p => ({ ...p, color: c }))} style={{
                  width: 30, height: 30, borderRadius: "50%", background: c, cursor: "pointer",
                  border: `3px solid ${newHabit.color === c ? "#fff" : "transparent"}`,
                  boxShadow: newHabit.color === c ? `0 0 10px ${c}` : "none",
                  transition: "all 0.2s",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAdd(false)} style={{
                flex: 1, padding: 12, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
                color: COLORS.textDim, cursor: "pointer", fontSize: 13,
              }}>Cancel</button>
              <button onClick={addHabit} style={{
                flex: 1, padding: 12, background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                border: "none", borderRadius: 10, color: "#fff", cursor: "pointer",
                fontSize: 13, fontWeight: 700, boxShadow: "0 4px 16px rgba(167,139,250,0.4)",
              }}>Launch Quest</button>
            </div>
          </div>
        </div>
      )}

      {editingHabit && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
        }} onClick={() => setEditingHabit(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "rgba(10,3,30,0.85)", border: `1px solid rgba(248,113,113,0.2)`, borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)", padding: 24, width: "100%", maxWidth: 320 }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 16px", fontSize: 16 }}>
              {editingHabit.icon} {editingHabit.name}
            </h3>
            <button onClick={() => deleteHabit(editingHabit.id)} style={{
              width: "100%", padding: 12, background: "rgba(248,113,113,0.1)",
              border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 10,
              color: COLORS.red, cursor: "pointer", fontSize: 13, fontWeight: 700, marginBottom: 8,
            }}>🗑 Abandon Quest</button>
            <button onClick={() => setEditingHabit(null)} style={{
              width: "100%", padding: 12, background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
              color: COLORS.textDim, cursor: "pointer", fontSize: 13,
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
