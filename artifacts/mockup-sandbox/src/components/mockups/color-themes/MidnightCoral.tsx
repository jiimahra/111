export function MidnightCoral() {
  const cards = [
    { cat: "🍱 Food", type: "Need Help", title: "Bete ke liye khana chahiye", loc: "Ajmer", name: "Ramesh K.", time: "2 min ago", urgent: true },
    { cat: "💊 Medical", type: "Give Help", title: "Free medicines available at clinic", loc: "Nasirabad", name: "Dr. Priya S.", time: "15 min ago", urgent: false },
    { cat: "💼 Job", type: "Need Help", title: "Koi kaam dilao bhai sahab", loc: "Beawar", name: "Suresh M.", time: "1 hr ago", urgent: false },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0F0F1A", minHeight: "100vh", maxWidth: 430, margin: "0 auto", overflowX: "hidden" }}>
      {/* Status Bar */}
      <div style={{ background: "linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 100%)", padding: "12px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 8 }}>
          <span style={{ fontWeight: 700 }}>9:41</span>
          <span>●●●</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 500 }}>नमस्ते 🙏</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
              <span style={{ color: "white" }}>सहा</span><span style={{ color: "#FF6B6B" }}>रा</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔔</div>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: "linear-gradient(135deg,#FF6B6B,#FF8E53)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "white" }}>N</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 20, border: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Search requests near you…</span>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Stats Row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Active", value: "234", icon: "📋", grad: "linear-gradient(135deg,#FF6B6B,#FF8E53)" },
            { label: "Helped", value: "89", icon: "🤝", grad: "linear-gradient(135deg,#4ECDC4,#2ECC71)" },
            { label: "Online", value: "12", icon: "👥", grad: "linear-gradient(135deg,#A78BFA,#6366F1)" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "14px 10px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -10, right: -10, width: 50, height: 50, borderRadius: 25, background: s.grad, opacity: 0.2 }} />
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "white", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Categories */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {[
            { emoji: "🍱", label: "Food", active: true },
            { emoji: "💊", label: "Medical" },
            { emoji: "💼", label: "Job" },
            { emoji: "🐕", label: "Animal" },
            { emoji: "📚", label: "Study" },
          ].map((c) => (
            <div key={c.label} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 62,
              background: c.active ? "linear-gradient(135deg, #FF6B6B, #FF8E53)" : "rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "10px 12px",
              border: c.active ? "none" : "1px solid rgba(255,255,255,0.1)",
              boxShadow: c.active ? "0 4px 20px rgba(255,107,107,0.4)" : "none",
            }}>
              <span style={{ fontSize: 22 }}>{c.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.active ? "white" : "rgba(255,255,255,0.6)" }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Feed title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>Nearby Requests</div>
          <div style={{ fontSize: 12, color: "#FF6B6B", fontWeight: 600 }}>See All →</div>
        </div>

        {/* Cards */}
        {cards.map((card, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 18,
            padding: 16,
            marginBottom: 12,
            border: `1px solid ${card.urgent ? "rgba(255,107,107,0.4)" : "rgba(255,255,255,0.08)"}`,
            position: "relative",
          }}>
            {card.urgent && (
              <div style={{ position: "absolute", top: 12, right: 12, background: "linear-gradient(135deg,#FF6B6B,#FF8E53)", color: "white", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, boxShadow: "0 2px 8px rgba(255,107,107,0.5)" }}>URGENT</div>
            )}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ background: "rgba(255,107,107,0.15)", borderRadius: 10, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#FF6B6B", border: "1px solid rgba(255,107,107,0.2)" }}>{card.cat}</div>
              <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{card.type}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 10, lineHeight: 1.3 }}>{card.title}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 15, background: "linear-gradient(135deg,#FF6B6B,#FF8E53)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 800 }}>{card.name[0]}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{card.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>📍 {card.loc} · {card.time}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 34, height: 34, borderRadius: 17, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💬</div>
                <div style={{ width: 34, height: 34, borderRadius: 17, background: "linear-gradient(135deg,#FF6B6B,#FF8E53)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤝</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "sticky", bottom: 0, background: "#0F0F1A", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-around", padding: "10px 0 20px" }}>
        {[
          { icon: "🏠", label: "Home", active: true },
          { icon: "👥", label: "People" },
          { icon: "➕", label: "" },
          { icon: "🔔", label: "Alerts" },
          { icon: "👤", label: "Profile" },
        ].map((n, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            {i === 2 ? (
              <div style={{ width: 52, height: 52, borderRadius: 26, background: "linear-gradient(135deg, #FF6B6B, #FF8E53)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginTop: -20, boxShadow: "0 4px 20px rgba(255,107,107,0.6)" }}>➕</div>
            ) : (
              <>
                <div style={{ fontSize: 22 }}>{n.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: n.active ? "#FF6B6B" : "rgba(255,255,255,0.3)" }}>{n.label}</div>
                {n.active && <div style={{ width: 4, height: 4, borderRadius: 2, background: "#FF6B6B" }} />}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
