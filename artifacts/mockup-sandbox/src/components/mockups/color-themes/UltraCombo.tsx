export function UltraCombo() {
  const cards = [
    { cat: "🍱 Food", type: "Need Help", title: "Bete ke liye khana chahiye", loc: "Ajmer", name: "Ramesh K.", time: "2 min ago", urgent: true, accentColor: "#FF6B00" },
    { cat: "💊 Medical", type: "Give Help", title: "Free medicines available at clinic", loc: "Nasirabad", name: "Dr. Priya S.", time: "15 min ago", urgent: false, accentColor: "#A855F7" },
    { cat: "💼 Job", type: "Need Help", title: "Koi kaam dilao bhai sahab", loc: "Beawar", name: "Suresh M.", time: "1 hr ago", urgent: false, accentColor: "#EC4899" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0D0D1A", minHeight: "100vh", maxWidth: 430, margin: "0 auto", overflowX: "hidden" }}>

      {/* HEADER — Purple→Pink→Orange mega gradient */}
      <div style={{
        background: "linear-gradient(135deg, #2D0A6E 0%, #7C3AED 30%, #EC4899 65%, #FF6B00 100%)",
        padding: "12px 20px 28px",
        borderRadius: "0 0 36px 36px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Glow blobs */}
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,107,0,0.25)", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", bottom: -20, left: 20, width: 100, height: 100, borderRadius: "50%", background: "rgba(124,58,237,0.3)", filter: "blur(25px)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.55)", fontSize: 11, marginBottom: 12 }}>
          <span style={{ fontWeight: 700 }}>9:41</span>
          <span>●●●</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 500 }}>नमस्ते 🙏</div>
            <div style={{ color: "white", fontSize: 26, fontWeight: 900, letterSpacing: -1 }}>सहारा</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 38, height: 38, borderRadius: 19, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔔</div>
            <div style={{
              width: 44, height: 44, borderRadius: 22,
              background: "linear-gradient(135deg, #FF6B00, #FBBF24)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 900, color: "white",
              border: "2.5px solid rgba(255,255,255,0.5)",
              boxShadow: "0 4px 15px rgba(255,107,0,0.5)",
            }}>N</div>
          </div>
        </div>

        {/* Search */}
        <div style={{
          background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)",
          borderRadius: 18, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
          border: "1px solid rgba(255,255,255,0.2)",
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>Search requests near you…</span>
        </div>

        {/* Stats in header */}
        <div style={{ display: "flex" }}>
          {[
            { label: "Requests", value: "234", color: "#FBBF24" },
            { label: "Helped", value: "89", color: "#A78BFA" },
            { label: "Online", value: "12", color: "#FB7185" },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1, textAlign: "center",
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.2)" : "none",
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "18px 16px 0" }}>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {[
            { emoji: "🍱", label: "Food", active: true, grad: "linear-gradient(135deg,#FF6B00,#FBBF24)" },
            { emoji: "💊", label: "Medical", active: false, grad: "linear-gradient(135deg,#7C3AED,#A855F7)" },
            { emoji: "💼", label: "Job", active: false, grad: "linear-gradient(135deg,#EC4899,#F43F5E)" },
            { emoji: "🐕", label: "Animal", active: false, grad: "" },
            { emoji: "📚", label: "Study", active: false, grad: "" },
          ].map((c) => (
            <div key={c.label} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 62,
              background: c.active ? c.grad : "rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "10px 12px",
              border: c.active ? "none" : "1px solid rgba(255,255,255,0.1)",
              boxShadow: c.active ? "0 6px 20px rgba(255,107,0,0.45)" : "none",
            }}>
              <span style={{ fontSize: 22 }}>{c.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.active ? "white" : "rgba(255,255,255,0.55)" }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Feed title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>Nearby Requests</div>
          <div style={{
            fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
            background: "linear-gradient(135deg,#7C3AED,#EC4899)",
            color: "white",
          }}>See All →</div>
        </div>

        {/* Cards */}
        {cards.map((card, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 20, padding: 16, marginBottom: 12,
            border: `1px solid ${card.urgent ? `${card.accentColor}55` : "rgba(255,255,255,0.08)"}`,
            position: "relative", overflow: "hidden",
          }}>
            {/* Colored top strip */}
            {card.urgent && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${card.accentColor}, #EC4899)`,
              }} />
            )}

            {card.urgent && (
              <div style={{
                position: "absolute", top: 12, right: 12,
                background: `linear-gradient(135deg, ${card.accentColor}, #EC4899)`,
                color: "white", fontSize: 9, fontWeight: 800,
                padding: "3px 10px", borderRadius: 20,
                boxShadow: `0 2px 10px ${card.accentColor}66`,
              }}>URGENT</div>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{
                background: `${card.accentColor}22`, borderRadius: 10,
                padding: "5px 10px", fontSize: 11, fontWeight: 700,
                color: card.accentColor, border: `1px solid ${card.accentColor}44`,
              }}>{card.cat}</div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>{card.type}</div>
            </div>

            <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 10, lineHeight: 1.35 }}>{card.title}</div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  background: `linear-gradient(135deg, ${card.accentColor}, #EC4899)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: 13, fontWeight: 800,
                  boxShadow: `0 2px 8px ${card.accentColor}55`,
                }}>{card.name[0]}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{card.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>📍 {card.loc} · {card.time}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>💬</div>
                <div style={{
                  width: 36, height: 36, borderRadius: 18,
                  background: `linear-gradient(135deg, ${card.accentColor}, #EC4899)`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                  boxShadow: `0 3px 12px ${card.accentColor}55`,
                }}>🤝</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "sticky", bottom: 0,
        background: "rgba(13,13,26,0.95)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", justifyContent: "space-around",
        padding: "10px 0 22px",
      }}>
        {[
          { icon: "🏠", label: "Home", active: true },
          { icon: "👥", label: "People" },
          { icon: "➕", label: "" },
          { icon: "🔔", label: "Alerts" },
          { icon: "👤", label: "Profile" },
        ].map((n, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            {i === 2 ? (
              <div style={{
                width: 54, height: 54, borderRadius: 27,
                background: "linear-gradient(135deg, #FF6B00, #EC4899, #7C3AED)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, marginTop: -22,
                boxShadow: "0 6px 24px rgba(236,72,153,0.6), 0 0 40px rgba(255,107,0,0.3)",
                border: "2px solid rgba(255,255,255,0.2)",
              }}>➕</div>
            ) : (
              <>
                <div style={{ fontSize: 22, filter: n.active ? "drop-shadow(0 0 6px #EC4899)" : "none" }}>{n.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: n.active ? "#EC4899" : "rgba(255,255,255,0.3)" }}>{n.label}</div>
                {n.active && (
                  <div style={{ width: 16, height: 3, borderRadius: 2, background: "linear-gradient(90deg,#FF6B00,#EC4899,#7C3AED)" }} />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
