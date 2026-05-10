export function SaffronBlaze() {
  const cards = [
    { cat: "🍱 Food", type: "Need Help", title: "Bete ke liye khana chahiye", loc: "Ajmer", name: "Ramesh K.", time: "2 min ago", urgent: true },
    { cat: "💊 Medical", type: "Give Help", title: "Free medicines available at clinic", loc: "Nasirabad", name: "Dr. Priya S.", time: "15 min ago", urgent: false },
    { cat: "💼 Job", type: "Need Help", title: "Koi kaam dilao bhai sahab", loc: "Beawar", name: "Suresh M.", time: "1 hr ago", urgent: false },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#FFF7ED", minHeight: "100vh", maxWidth: 430, margin: "0 auto", overflowX: "hidden" }}>
      {/* Status Bar */}
      <div style={{ background: "linear-gradient(135deg, #EA580C 0%, #F97316 50%, #FBBF24 100%)", padding: "12px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "white", fontSize: 11, opacity: 0.9, marginBottom: 8 }}>
          <span style={{ fontWeight: 700 }}>9:41</span>
          <span>●●●</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 20 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 500 }}>नमस्ते 🙏</div>
            <div style={{ color: "white", fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>सहारा</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔔</div>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: "#FBBF24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#92400E", border: "3px solid rgba(255,255,255,0.5)" }}>N</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <span style={{ color: "#9CA3AF", fontSize: 14 }}>Search requests near you…</span>
        </div>
      </div>

      {/* Wave separator */}
      <div style={{ height: 24, background: "linear-gradient(135deg, #EA580C 0%, #F97316 50%, #FBBF24 100%)", borderRadius: "0 0 24px 24px", marginBottom: 4 }} />

      <div style={{ padding: "0 16px" }}>
        {/* Stats Row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, marginTop: 8 }}>
          {[
            { label: "Active Requests", value: "234", icon: "📋", color: "#FED7AA", text: "#C2410C" },
            { label: "Helped Today", value: "89", icon: "🤝", color: "#D1FAE5", text: "#065F46" },
            { label: "Online Now", value: "12", icon: "👥", color: "#E0E7FF", text: "#3730A3" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: s.color, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.text, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: s.text, opacity: 0.7, fontWeight: 600 }}>{s.label}</div>
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
            { emoji: "📚", label: "Education" },
          ].map((c) => (
            <div key={c.label} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 60,
              background: c.active ? "linear-gradient(135deg, #EA580C, #FBBF24)" : "white",
              borderRadius: 14, padding: "10px 12px",
              boxShadow: c.active ? "0 4px 15px rgba(234,88,12,0.4)" : "0 2px 8px rgba(0,0,0,0.06)",
              transform: c.active ? "scale(1.05)" : "scale(1)",
            }}>
              <span style={{ fontSize: 22 }}>{c.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.active ? "white" : "#374151" }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Feed title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Nearby Requests</div>
          <div style={{ fontSize: 12, color: "#EA580C", fontWeight: 600 }}>See All →</div>
        </div>

        {/* Cards */}
        {cards.map((card, i) => (
          <div key={i} style={{
            background: "white",
            borderRadius: 18,
            padding: 16,
            marginBottom: 12,
            boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
            borderLeft: card.urgent ? "4px solid #EA580C" : "4px solid #E5E7EB",
            position: "relative",
            overflow: "hidden",
          }}>
            {card.urgent && (
              <div style={{ position: "absolute", top: 10, right: 10, background: "linear-gradient(135deg,#EA580C,#FBBF24)", color: "white", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20 }}>URGENT</div>
            )}
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div style={{ background: "#FFF7ED", borderRadius: 10, padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "#EA580C" }}>{card.cat}</div>
              <div style={{ background: "#F3F4F6", borderRadius: 10, padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "#374151" }}>{card.type}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6, lineHeight: 1.3 }}>{card.title}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: "linear-gradient(135deg,#EA580C,#FBBF24)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 800 }}>{card.name[0]}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{card.name}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>📍 {card.loc} · {card.time}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💬</div>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: "linear-gradient(135deg,#EA580C,#FBBF24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤝</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "sticky", bottom: 0, background: "white", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-around", padding: "10px 0 20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
        {[
          { icon: "🏠", label: "Home", active: true },
          { icon: "👥", label: "People" },
          { icon: "➕", label: "" },
          { icon: "🔔", label: "Alerts" },
          { icon: "👤", label: "Profile" },
        ].map((n, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            {i === 2 ? (
              <div style={{ width: 52, height: 52, borderRadius: 26, background: "linear-gradient(135deg, #EA580C, #FBBF24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginTop: -20, boxShadow: "0 4px 16px rgba(234,88,12,0.5)" }}>➕</div>
            ) : (
              <>
                <div style={{ fontSize: 22 }}>{n.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: n.active ? "#EA580C" : "#9CA3AF" }}>{n.label}</div>
                {n.active && <div style={{ width: 4, height: 4, borderRadius: 2, background: "#EA580C" }} />}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
