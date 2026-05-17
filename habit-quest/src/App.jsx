import { useState, useEffect, useCallback, useRef } from "react";

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
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return dates;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getLevelInfo(xp) {
  const level = Math.floor(xp / 100) + 1;
  const currentLevelXp = xp % 100;
  const titles = ["Seedling", "Sprout", "Sapling", "Tree", "Oak", "Sequoia", "Legend", "Titan", "Mythic", "Transcendent"];
  return { level, currentLevelXp, nextLevelXp: 100, title: titles[Math.min(level - 1, titles.length - 1)] };
}

const HABIT_ICONS = ["💪", "📖", "🧘", "💧", "🏃", "😴", "🍎", "✍️", "🎯", "🧠", "🎵", "💊", "🚶", "📵", "🌅"];
const FREQUENCIES = ["daily", "weekly", "monthly"];

const initialHabits = [
  { id: 1, name: "Exercise", icon: "💪", frequency: "daily", color: "#FF6B6B" },
  { id: 2, name: "Read 30 min", icon: "📖", frequency: "daily", color: "#4ECDC4" },
  { id: 3, name: "Meditate", icon: "🧘", frequency: "daily", color: "#FFE66D" },
  { id: 4, name: "Drink 8 glasses", icon: "💧", frequency: "daily", color: "#45B7D1" },
  { id: 5, name: "Sleep 8 hrs", icon: "😴", frequency: "daily", color: "#96CEB4" },
];

function ConfettiParticle({ x, y, color, delay }) {
  return (
    <div
      style={{
        position: "fixed", left: x, top: y, width: 8, height: 8,
        backgroundColor: color, borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        animation: `confettiFall 1.5s ease-out ${delay}s forwards`,
        zIndex: 9999, pointerEvents: "none",
      }}
    />
  );
}

export default function HabitTracker() {
  const [habits, setHabits] = useState(initialHabits);
  const [completions, setCompletions] = useState({});
  const [xp, setXp] = useState(0);
  const [view, setView] = useState("today");
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", icon: "💪", frequency: "daily", color: "#FF6B6B" });
  const [confetti, setConfetti] = useState([]);
  const [editingHabit, setEditingHabit] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const confettiTimeout = useRef(null);

  // Load from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("habit-tracker-data");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.habits) setHabits(parsed.habits);
        if (parsed.completions) setCompletions(parsed.completions);
        if (parsed.xp !== undefined) setXp(parsed.xp);
      }
    } catch (e) { /* first run */ }
  }, []);

  // Save to storage
  const saveData = useCallback((h, c, x) => {
    try {
      localStorage.setItem("habit-tracker-data", JSON.stringify({ habits: h, completions: c, xp: x }));
    } catch (e) { console.error(e); }
  }, []);

  const triggerConfetti = useCallback(() => {
    const particles = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * window.innerWidth,
      y: -20,
      color: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#45B7D1", "#96CEB4", "#DDA0DD", "#F0E68C"][Math.floor(Math.random() * 7)],
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
      if (next[key]) {
        delete next[key];
        newXp = Math.max(0, newXp - 10);
      } else {
        next[key] = true;
        newXp += 10;
        triggerConfetti();
      }
      setXp(newXp);
      saveData(habits, next, newXp);
      return next;
    });
  }, [habits, xp, saveData, triggerConfetti]);

  const getStreak = useCallback((habitId) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (completions[`${habitId}-${dateStr}`]) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  }, [completions]);

  const addHabit = useCallback(() => {
    if (!newHabit.name.trim()) return;
    const h = [...habits, { ...newHabit, id: Date.now(), name: newHabit.name.trim() }];
    setHabits(h);
    setNewHabit({ name: "", icon: "💪", frequency: "daily", color: "#FF6B6B" });
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
    setHabits(initialHabits);
    setCompletions({});
    setXp(0);
    localStorage.removeItem("habit-tracker-data");
  }, []);

  const today = getToday();
  const weekDates = getWeekDates();
  const levelInfo = getLevelInfo(xp);
  const todayHabits = habits.filter(h => h.frequency === "daily");
  const todayDone = todayHabits.filter(h => completions[`${h.id}-${today}`]).length;
  const todayTotal = todayHabits.length;
  const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  const COLORS = {
    bg: "#0D1117",
    card: "#161B22",
    cardHover: "#1C2333",
    border: "#30363D",
    text: "#E6EDF3",
    textDim: "#8B949E",
    accent: "#58A6FF",
    green: "#3FB950",
    red: "#F85149",
    yellow: "#D29922",
    purple: "#BC8CFF",
  };

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: COLORS.bg, color: COLORS.text,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      padding: "16px", maxWidth: 520, margin: "0 auto",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(88,166,255,0.3); } 50% { box-shadow: 0 0 20px rgba(88,166,255,0.6); } }
        @keyframes checkPop { 0% { transform: scale(0); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
        * { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: ${COLORS.border} transparent; }
        input, button { font-family: inherit; }
      `}</style>

      {confetti.map(p => <ConfettiParticle key={p.id} {...p} />)}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24, animation: "slideUp 0.5s ease-out" }}>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700,
          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: "0 0 4px",
        }}>
          ⚡ HABIT QUEST
        </h1>
        <p style={{ color: COLORS.textDim, fontSize: 12, margin: 0, letterSpacing: 2 }}>LEVEL UP YOUR LIFE</p>
      </div>

      {/* Level / XP Bar */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12,
        padding: 16, marginBottom: 16, animation: "slideUp 0.6s ease-out",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 20, fontWeight: 700 }}>Lv.{levelInfo.level}</span>
            <span style={{ color: COLORS.purple, fontSize: 13, marginLeft: 8, fontWeight: 500 }}>{levelInfo.title}</span>
          </div>
          <span style={{ color: COLORS.yellow, fontSize: 13, fontWeight: 600 }}>⭐ {xp} XP</span>
        </div>
        <div style={{ background: COLORS.bg, borderRadius: 8, height: 10, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 8,
            width: `${(levelInfo.currentLevelXp / levelInfo.nextLevelXp) * 100}%`,
            background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.purple})`,
            transition: "width 0.5s ease",
            animation: levelInfo.currentLevelXp > 80 ? "glow 2s infinite" : "none",
          }} />
        </div>
        <p style={{ color: COLORS.textDim, fontSize: 11, margin: "6px 0 0", textAlign: "right" }}>
          {levelInfo.currentLevelXp}/{levelInfo.nextLevelXp} to next level
        </p>
      </div>

      {/* Today's Progress Ring */}
      {view === "today" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 16, background: COLORS.card,
          border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, marginBottom: 16,
          animation: "slideUp 0.7s ease-out",
        }}>
          <div style={{ position: "relative", width: 70, height: 70, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: 70, height: 70, transform: "rotate(-90deg)" }}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke={COLORS.border} strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke={todayPct === 100 ? COLORS.green : COLORS.accent} strokeWidth="3"
                strokeDasharray={`${todayPct}, 100`}
                style={{ transition: "stroke-dasharray 0.8s ease, stroke 0.3s" }} />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, color: todayPct === 100 ? COLORS.green : COLORS.text,
            }}>
              {todayPct}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Today's Progress</div>
            <div style={{ color: COLORS.textDim, fontSize: 13, marginTop: 2 }}>
              {todayDone}/{todayTotal} habits done
            </div>
            {todayPct === 100 && (
              <div style={{ color: COLORS.green, fontSize: 12, marginTop: 4, fontWeight: 600, animation: "pulse 2s infinite" }}>
                🎉 Perfect day!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 16, background: COLORS.card,
        borderRadius: 10, padding: 4, border: `1px solid ${COLORS.border}`,
      }}>
        {[
          { key: "today", label: "Today" },
          { key: "week", label: "Week" },
          { key: "month", label: "Month" },
          { key: "stats", label: "Stats" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key)} style={{
            flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer",
            fontSize: 12, fontWeight: 600, letterSpacing: 0.5, transition: "all 0.2s",
            background: view === tab.key ? COLORS.accent : "transparent",
            color: view === tab.key ? "#fff" : COLORS.textDim,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TODAY VIEW */}
      {view === "today" && (
        <div>
          {habits.filter(h => h.frequency === "daily").map((habit, i) => {
            const done = completions[`${habit.id}-${today}`];
            const streak = getStreak(habit.id);
            return (
              <div key={habit.id} onClick={() => toggleCompletion(habit.id, today)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: 14,
                background: done ? `${habit.color}15` : COLORS.card,
                border: `1px solid ${done ? habit.color + "40" : COLORS.border}`,
                borderRadius: 12, marginBottom: 8, cursor: "pointer",
                transition: "all 0.2s", animation: `slideUp ${0.3 + i * 0.08}s ease-out`,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 22,
                  background: done ? habit.color + "30" : COLORS.bg,
                  border: `2px solid ${done ? habit.color : COLORS.border}`,
                  transition: "all 0.3s",
                }}>
                  {done ? "✅" : habit.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    textDecoration: done ? "line-through" : "none",
                    color: done ? COLORS.textDim : COLORS.text,
                  }}>{habit.name}</div>
                  {streak > 0 && (
                    <div style={{ fontSize: 11, color: COLORS.yellow, marginTop: 2 }}>
                      🔥 {streak} day streak
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: 11, color: COLORS.textDim, background: COLORS.bg,
                  padding: "4px 8px", borderRadius: 6,
                }}>
                  +10 XP
                </div>
                <button onClick={(e) => { e.stopPropagation(); setEditingHabit(habit); }} style={{
                  background: "none", border: "none", color: COLORS.textDim, cursor: "pointer",
                  fontSize: 16, padding: 4,
                }}>⋮</button>
              </div>
            );
          })}
        </div>
      )}

      {/* WEEK VIEW */}
      {view === "week" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, color: COLORS.textDim, fontWeight: 500 }}>Habit</th>
                {DAYS.map((d, i) => (
                  <th key={d} style={{
                    padding: 8, color: weekDates[i] === today ? COLORS.accent : COLORS.textDim,
                    fontWeight: weekDates[i] === today ? 700 : 500, fontSize: 11,
                  }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.filter(h => h.frequency === "daily").map(habit => (
                <tr key={habit.id}>
                  <td style={{ padding: 8, fontSize: 13 }}>
                    <span style={{ marginRight: 6 }}>{habit.icon}</span>{habit.name}
                  </td>
                  {weekDates.map(date => {
                    const done = completions[`${habit.id}-${date}`];
                    return (
                      <td key={date} style={{ padding: 4, textAlign: "center" }}>
                        <button onClick={() => toggleCompletion(habit.id, date)} style={{
                          width: 30, height: 30, borderRadius: 8, border: `2px solid ${done ? habit.color : COLORS.border}`,
                          background: done ? habit.color + "40" : "transparent", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, transition: "all 0.2s", margin: "0 auto",
                          animation: done ? "checkPop 0.3s ease-out" : "none",
                          color: done ? "#fff" : "transparent",
                        }}>
                          {done ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MONTH VIEW */}
      {view === "month" && (
        <div style={{ animation: "slideUp 0.4s ease-out" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => {
              if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
              else setSelectedMonth(m => m - 1);
            }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>◀</button>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{MONTHS[selectedMonth]} {selectedYear}</span>
            <button onClick={() => {
              if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
              else setSelectedMonth(m => m + 1);
            }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>▶</button>
          </div>
          {habits.filter(h => h.frequency === "daily").map(habit => {
            const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const doneCount = days.filter(d => {
              const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              return completions[`${habit.id}-${dateStr}`];
            }).length;
            return (
              <div key={habit.id} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12,
                padding: 12, marginBottom: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{habit.icon} {habit.name}</span>
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
                        background: done ? habit.color + "60" : COLORS.bg,
                        border: isToday ? `2px solid ${COLORS.accent}` : `1px solid ${done ? habit.color + "40" : COLORS.border}`,
                        color: done ? "#fff" : COLORS.textDim, cursor: "pointer",
                        fontWeight: isToday ? 700 : 400, transition: "all 0.15s",
                      }}>{d}</div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STATS VIEW */}
      {view === "stats" && (
        <div style={{ animation: "slideUp 0.4s ease-out" }}>
          {habits.filter(h => h.frequency === "daily").map(habit => {
            const streak = getStreak(habit.id);
            const last30 = Array.from({ length: 30 }, (_, i) => {
              const d = new Date(); d.setDate(d.getDate() - (29 - i));
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              return completions[`${habit.id}-${dateStr}`] ? 1 : 0;
            });
            const rate = Math.round((last30.filter(x => x).length / 30) * 100);
            return (
              <div key={habit.id} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12,
                padding: 14, marginBottom: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{habit.icon} {habit.name}</span>
                  <span style={{ color: COLORS.yellow, fontSize: 12 }}>🔥 {streak}d</span>
                </div>
                <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                  {last30.map((v, i) => (
                    <div key={i} style={{
                      flex: 1, height: 20, borderRadius: 3,
                      background: v ? habit.color + "80" : COLORS.bg,
                      border: `1px solid ${v ? habit.color + "40" : COLORS.border}`,
                    }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: COLORS.textDim }}>Last 30 days</span>
                  <span style={{ fontSize: 11, color: rate >= 80 ? COLORS.green : rate >= 50 ? COLORS.yellow : COLORS.red, fontWeight: 600 }}>
                    {rate}% completion
                  </span>
                </div>
              </div>
            );
          })}

          {/* Overall Stats */}
          <div style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12,
            padding: 16, marginTop: 8,
          }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, margin: "0 0 12px", color: COLORS.accent }}>
              📊 Overall Stats
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Total XP", value: `⭐ ${xp}`, color: COLORS.yellow },
                { label: "Level", value: `Lv.${levelInfo.level}`, color: COLORS.purple },
                { label: "Habits", value: habits.length, color: COLORS.accent },
                { label: "Completions", value: Object.keys(completions).length, color: COLORS.green },
              ].map(s => (
                <div key={s.label} style={{
                  background: COLORS.bg, borderRadius: 8, padding: 12, textAlign: "center",
                  border: `1px solid ${COLORS.border}`,
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={resetAll} style={{
            width: "100%", marginTop: 16, padding: 12, background: "transparent",
            border: `1px solid ${COLORS.red}40`, borderRadius: 10, color: COLORS.red,
            cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}>
            🗑 Reset All Data
          </button>
        </div>
      )}

      {/* Add Habit Button */}
      <button onClick={() => setShowAdd(true)} style={{
        position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%",
        background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`,
        border: "none", color: "#fff", fontSize: 28, cursor: "pointer",
        boxShadow: `0 4px 20px ${COLORS.accent}40`, transition: "transform 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
        onMouseEnter={e => e.target.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.target.style.transform = "scale(1)"}
      >+</button>

      {/* Add Habit Modal */}
      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
        }} onClick={() => setShowAdd(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16,
            padding: 24, width: "100%", maxWidth: 400, animation: "slideUp 0.3s ease-out",
          }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 16px", fontSize: 18 }}>
              ➕ New Habit
            </h3>
            <input value={newHabit.name} onChange={e => setNewHabit(p => ({ ...p, name: e.target.value }))}
              placeholder="Habit name..." style={{
                width: "100%", padding: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                borderRadius: 8, color: COLORS.text, fontSize: 14, marginBottom: 12, outline: "none",
              }} />
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginBottom: 6 }}>Icon</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {HABIT_ICONS.map(icon => (
                  <button key={icon} onClick={() => setNewHabit(p => ({ ...p, icon }))} style={{
                    width: 36, height: 36, borderRadius: 8, border: `2px solid ${newHabit.icon === icon ? COLORS.accent : COLORS.border}`,
                    background: newHabit.icon === icon ? COLORS.accent + "20" : COLORS.bg,
                    fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{icon}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: COLORS.textDim, display: "block", marginBottom: 6 }}>Color</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["#FF6B6B", "#4ECDC4", "#FFE66D", "#45B7D1", "#96CEB4", "#DDA0DD", "#FF8C42", "#6C5CE7"].map(c => (
                  <button key={c} onClick={() => setNewHabit(p => ({ ...p, color: c }))} style={{
                    width: 30, height: 30, borderRadius: "50%", border: `3px solid ${newHabit.color === c ? "#fff" : "transparent"}`,
                    background: c, cursor: "pointer",
                  }} />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{
                flex: 1, padding: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                borderRadius: 8, color: COLORS.text, cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}>Cancel</button>
              <button onClick={addHabit} style={{
                flex: 1, padding: 12, background: COLORS.accent, border: "none",
                borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}>Add Habit</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Delete Modal */}
      {editingHabit && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
        }} onClick={() => setEditingHabit(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16,
            padding: 24, width: "100%", maxWidth: 320, animation: "slideUp 0.3s ease-out",
          }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 16px", fontSize: 16 }}>
              {editingHabit.icon} {editingHabit.name}
            </h3>
            <button onClick={() => deleteHabit(editingHabit.id)} style={{
              width: "100%", padding: 12, background: COLORS.red + "20", border: `1px solid ${COLORS.red}40`,
              borderRadius: 8, color: COLORS.red, cursor: "pointer", fontSize: 13, fontWeight: 600,
              marginBottom: 8,
            }}>🗑 Delete Habit</button>
            <button onClick={() => setEditingHabit(null)} style={{
              width: "100%", padding: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              borderRadius: 8, color: COLORS.text, cursor: "pointer", fontSize: 13,
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
