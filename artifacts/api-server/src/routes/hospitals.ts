import { Router } from "express";

const router = Router();

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTime(km: number) {
  const mins = Math.round((km / 35) * 60);
  if (mins < 60) return `${mins} मिनट`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h} घंटा`;
}

async function nominatimSearch(query: string, viewbox: string, limit: number) {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json&bounded=1&viewbox=${viewbox}&limit=${limit}&addressdetails=1&extratags=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "SaharaApp/1.0 (community help India; saharaapphelp@gmail.com)",
      "Accept-Language": "hi,en",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  return res.json() as Promise<any[]>;
}

router.get("/hospitals", async (req, res) => {
  try {
    const { lat, lng } = req.query as { lat?: string; lng?: string };
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const deg = 0.9; // ~100km
    const viewbox = `${userLng - deg},${userLat + deg},${userLng + deg},${userLat - deg}`;

    const [hospItems, vetItems] = await Promise.all([
      nominatimSearch("hospital clinic", viewbox, 60).catch(() => []),
      nominatimSearch("veterinary", viewbox, 30).catch(() => []),
    ]);

    const seen = new Set<string>();
    const hospitals = [...hospItems, ...vetItems]
      .map((item: any) => {
        const elLat = parseFloat(item.lat);
        const elLng = parseFloat(item.lon);
        if (!elLat || !elLng) return null;

        const name = item.display_name?.split(",")[0]?.trim() || "अज्ञात अस्पताल";
        const extra = item.extratags || {};
        const addr = item.address || {};
        const isVet =
          item.type === "veterinary" ||
          extra["healthcare"] === "veterinary" ||
          vetItems.includes(item);

        const km = Math.round(haversineKm(userLat, userLng, elLat, elLng) * 10) / 10;
        const address = [addr.road, addr.suburb, addr.city || addr.town || addr.village, addr.state]
          .filter(Boolean)
          .join(", ");

        return {
          id: `nom-${item.place_id}`,
          name,
          type: isVet ? "vet" : "hospital",
          address,
          distanceKm: km,
          distanceText: `${km.toFixed(1)} km`,
          travelTime: estimateTime(km),
          open: null as boolean | null,
          phone: extra["phone"] || extra["contact:phone"] || null,
          lat: elLat,
          lng: elLng,
          emergency: extra["emergency"] === "yes",
          beds: extra["beds"] || null,
        };
      })
      .filter((h): h is NonNullable<typeof h> => {
        if (!h) return false;
        if (h.distanceKm > 100) return false;
        const key = h.name.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ hospitals, total: hospitals.length });
  } catch (err: any) {
    console.error("Hospital fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch hospitals", message: err.message });
  }
});

export default router;
