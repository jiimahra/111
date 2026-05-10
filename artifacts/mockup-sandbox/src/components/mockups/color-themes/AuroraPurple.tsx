export function AuroraPurple() {
  const cards = [
    { cat: "🍱 Food", type: "Need Help", title: "Bete ke liye khana chahiye", loc: "Ajmer", name: "Ramesh K.", time: "2 min ago", urgent: true },
    { cat: "💊 Medical", type: "Give Help", title: "Free medicines available at clinic", loc: "Nasirabad", name: "Dr. Priya S.", time: "15 min ago", urgent: false },
    { cat: "💼 Job", type: "Need Help", title: "Koi kaam dilao bhai sahab", loc: "Beawar", name: "Suresh M.", time: "1 hr ago", urgent: false },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F5F3FF", minHeight: "100vh", maxWidth: 430, margin: "0 auto", overflowX: "hidden" }}>
      {/* Header with big gradient */}
      <div style={{ background: "linear-gradient(145deg, #4C1D95 0%, #7C3AED 40%, #A78BFA 70%, #EC4899 100%)", padding: "12px 20px 0", borderRadius: "0 0 32px 32px", paddingBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 10 }}>
          <span style={{ fontWeight: 700 }}>9:41</span>
          <span>●●●</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500 }}>नमस्ते 🙏</div>
            <div style={{ color: "white", fontSize: 26, fontWeight: 900, letterSpacing: -1 }}>सहारा</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 38, height: 38, borderRadius: 19, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: "1px solid rgba(255,255,255,0.3)" }}>🔔</div>
            <div style={{ width: 42, height: 42, borderRadius: 21, background: "linear-gradient(135deg,#EC4899,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "white", border: "2px solid rgba(255,255,255,0.5)", boxShadow: "0 4px 12px rgba(236,72,153,0.5)" }}>N</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 18, padding: "13px 18px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(76,29,149,0.25)" }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <span style={{ color: "#9CA3AF", fontSize: 14 }}>Search requests near you…</span>
        </div>

        {/* Stats inside header */}
        <div style={{ display: "flex", gap: 0, marginTop: 20 }}>
          {[
            { label: "Requests", value: "234", icon: "📋" },
            { label: "Helped", value: "89", icon: "🤝" },
            { label: "Online", value: "12", icon: "👥" },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.2)" : "none" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "white" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{s.icon} {s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
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
              background: c.active ? "linear-gradient(135deg, #7C3AED, #EC4899)" : "white",
              borderRadius: 16, padding: "10px 12px",
              boxShadow: c.active ? "0 6px 20px rgba(124,58,237,0.5)" : "0 2px 8px rgba(0,0,0,0.05)",
              border: c.active ? "none" : "1px solid #E5E7EB",
            }}>
              <span style={{ fontSize: 22 }}>{c.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.active ? "white" : "#374151" }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Feed title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1F1F3E" }}>Nearby Requests</div>
          <div style={{ fontSize: 12, color: "#7C3AED", fontWeight: 700 }}>See All →</div>
        </div>

        {/* Cards */}
        {cards.map((card, i) => (
          <div key={i} style={{
            background: "white",
            borderRadius: 20,
            padding: 16,
            marginBottom: 12,
            boxShadow: card.urgent ? "0 4px 20px rgba(124,58,237,0.15)" : "0 2px 10px rgba(0,0,0,0.06)",
            border: card.urgent ? "1.5px solid rgba(124,58,237,0.3)" : "1.5px solid transparent",
            position: "relative",
            overflow: "hidden",
          }}>
            {card.urgent && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#7C3AED,#EC4899)" }} />
            )}
            {card.urgent && (
              <div style={{ position: "absolute", top: 12, right: 12, background: "linear-gradient(135deg,#7C3AED,#EC4899)", color: "white", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20 }}>URGENT</div>
            )}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ background: "#EDE9FE", borderRadius: 10, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#7C3AED" }}>{card.cat}</div>
              <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#6B7280" }}>{card.type}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1F1F3E", marginBottom: 10, lineHeight: 1.3 }}>{card.title}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 15, background: "linear-gradient(135deg,#7C3AED,#EC4899)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 800 }}>{card.name[0]}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{card.name}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>📍 {card.loc} · {card.time}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 34, height: 34, borderRadius: 17, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💬</div>
                <div style={{ width: 34, height: 34, borderRadius: 17, background: "linear-gradient(135deg,#7C3AED,#EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: "0 2px 8px rgba(124,58,237,0.4)" }}>🤝</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "sticky", bottom: 0, background: "white", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-around", padding: "10px 0 20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
        {[
          { icon: "🏠", label: "Home", active: true },
          { icon: "👥", label: "People" },
          { icon: "➕", label: "" },
          { icon: "🔔", label: "Alerts" },
          { icon: "👤", label: "Profile" },
        ].map((n, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            {i === 2 ? (
              <div style={{ width: 52, height: 52, borderRadius: 26, background: "linear-gradient(135deg, #7C3AED, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginTop: -20, boxShadow: "0 6px 20px rgba(124,58,237,0.5)" }}>➕</div>
            ) : (
              <>
                <div style={{ fontSize: 22 }}>{n.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: n.active ? "#7C3AED" : "#9CA3AF" }}>{n.label}</div>
                {n.active && <div style={{ width: 4, height: 4, borderRadius: 2, background: "linear-gradient(90deg,#7C3AED,#EC4899)", backgroundClip: "padding-box" }} />}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
