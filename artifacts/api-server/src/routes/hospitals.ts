import { Router } from "express";

const router = Router();

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isOpenNow(tags: Record<string, string>): boolean | null {
  const hours = tags["opening_hours"];
  if (!hours) return null;
  if (hours === "24/7" || hours === "00:00-24:00") return true;

  try {
    const now = new Date();
    const day = now.getDay();
    const timeNow = now.getHours() * 60 + now.getMinutes();

    const dayMap: Record<number, string[]> = {
      0: ["Su", "Sun", "Sunday"],
      1: ["Mo", "Mon", "Monday"],
      2: ["Tu", "Tue", "Tuesday"],
      3: ["We", "Wed", "Wednesday"],
      4: ["Th", "Thu", "Thursday"],
      5: ["Fr", "Fri", "Friday"],
      6: ["Sa", "Sat", "Saturday"],
    };
    const todayAbbrs = dayMap[day];

    const parts = hours.split(";").map((s) => s.trim());
    for (const part of parts) {
      const match = part.match(/^(.+?)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
      if (!match) continue;
      const [, daySpec, openStr, closeStr] = match;
      const dayMatches = todayAbbrs.some((abbr) => daySpec.includes(abbr));
      if (!dayMatches) continue;
      const [oh, om] = openStr.split(":").map(Number);
      const [ch, cm] = closeStr.split(":").map(Number);
      const openMin = oh * 60 + om;
      const closeMin = ch * 60 + cm;
      if (timeNow >= openMin && timeNow <= closeMin) return true;
      return false;
    }
  } catch {
  }
  return null;
}

function estimateTravelTime(distanceKm: number): string {
  const avgSpeedKmh = 35;
  const minutes = Math.round((distanceKm / avgSpeedKmh) * 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getAddress(tags: Record<string, string>): string {
  const parts: string[] = [];
  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:suburb"]) parts.push(tags["addr:suburb"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:state"]) parts.push(tags["addr:state"]);
  if (parts.length === 0 && tags["is_in"]) return tags["is_in"];
  return parts.join(", ");
}

router.get("/hospitals", async (req, res) => {
  try {
    const { lat, lng, radius = "100000" } = req.query as {
      lat?: string;
      lng?: string;
      radius?: string;
    };

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = Math.min(parseInt(radius), 100000);

    const overpassQuery = `
[out:json][timeout:30];
(
  node["amenity"="hospital"](around:${searchRadius},${userLat},${userLng});
  way["amenity"="hospital"](around:${searchRadius},${userLat},${userLng});
  relation["amenity"="hospital"](around:${searchRadius},${userLat},${userLng});
  node["amenity"="clinic"](around:${searchRadius},${userLat},${userLng});
  way["amenity"="clinic"](around:${searchRadius},${userLat},${userLng});
  node["amenity"="veterinary"](around:${searchRadius},${userLat},${userLng});
  way["amenity"="veterinary"](around:${searchRadius},${userLat},${userLng});
  node["amenity"="doctors"](around:${searchRadius},${userLat},${userLng});
  node["healthcare"="hospital"](around:${searchRadius},${userLat},${userLng});
  way["healthcare"="hospital"](around:${searchRadius},${userLat},${userLng});
  node["healthcare"="veterinary"](around:${searchRadius},${userLat},${userLng});
);
out center 80;
    `.trim();

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: AbortSignal.timeout(28000),
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json() as { elements: OverpassElement[] };

    const hospitals = data.elements
      .map((el) => {
        const tags = el.tags || {};
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (!elLat || !elLng) return null;

        const name = tags["name"] || tags["name:en"] || tags["name:hi"] || "Unknown Hospital";
        const amenity = tags["amenity"] || tags["healthcare"] || "";
        const isVet = amenity === "veterinary" || (tags["healthcare"] === "veterinary");
        const distanceKm = haversineDistance(userLat, userLng, elLat, elLng);
        const openStatus = isOpenNow(tags);
        const address = getAddress(tags);
        const phone = tags["phone"] || tags["contact:phone"] || tags["phone:IN"] || null;

        return {
          id: `${el.type}-${el.id}`,
          name,
          type: isVet ? "vet" : "hospital",
          address: address || `${elLat.toFixed(4)}, ${elLng.toFixed(4)}`,
          distanceKm: Math.round(distanceKm * 10) / 10,
          distanceText: `${(Math.round(distanceKm * 10) / 10).toFixed(1)} km`,
          travelTime: estimateTravelTime(distanceKm),
          open: openStatus,
          phone,
          lat: elLat,
          lng: elLng,
          website: tags["website"] || tags["contact:website"] || null,
          emergency: tags["emergency"] === "yes",
          beds: tags["beds"] || null,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm);

    const seen = new Set<string>();
    const unique = hospitals.filter((h: any) => {
      const key = h.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({ hospitals: unique, total: unique.length });
  } catch (err: any) {
    console.error("Hospital fetch error:", err);
    res.status(500).json({ error: "Failed to fetch hospitals", message: err.message });
  }
});

export default router;
