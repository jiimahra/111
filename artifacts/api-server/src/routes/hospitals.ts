import { Router } from "express";

const router = Router();

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
      0: ["Su", "Sun"],
      1: ["Mo", "Mon"],
      2: ["Tu", "Tue"],
      3: ["We", "Wed"],
      4: ["Th", "Thu"],
      5: ["Fr", "Fri"],
      6: ["Sa", "Sat"],
    };
    const todayAbbrs = dayMap[day];
    for (const part of hours.split(";").map((s) => s.trim())) {
      const match = part.match(/^(.+?)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
      if (!match) continue;
      const [, daySpec, openStr, closeStr] = match;
      if (!todayAbbrs.some((a) => daySpec.includes(a))) continue;
      const [oh, om] = openStr.split(":").map(Number);
      const [ch, cm] = closeStr.split(":").map(Number);
      return timeNow >= oh * 60 + om && timeNow <= ch * 60 + cm;
    }
  } catch {}
  return null;
}

function estimateTravelTime(distanceKm: number): string {
  const minutes = Math.round((distanceKm / 35) * 60);
  if (minutes < 60) return `${minutes} मिनट`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} घंटा ${m} मिनट` : `${h} घंटा`;
}

function getAddress(tags: Record<string, string>): string {
  const parts: string[] = [];
  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:suburb"]) parts.push(tags["addr:suburb"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:state"]) parts.push(tags["addr:state"]);
  if (parts.length > 0) return parts.join(", ");
  if (tags["is_in"]) return tags["is_in"];
  return "";
}

async function queryOverpass(query: string): Promise<any> {
  const body = `data=${encodeURIComponent(query)}`;
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "SaharaApp/1.0 (community help platform; contact@saharaapp.in)",
    "Accept": "application/json",
  };

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) {
        return await res.json();
      }
      console.warn(`Overpass endpoint ${endpoint} returned ${res.status}`);
    } catch (e) {
      console.warn(`Overpass endpoint ${endpoint} failed:`, e);
    }
  }
  throw new Error("All Overpass endpoints failed");
}

router.get("/hospitals", async (req, res) => {
  try {
    const { lat, lng } = req.query as { lat?: string; lng?: string };
    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng required" });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radius = 100000;

    const query = `
[out:json][timeout:25];
(
  node["amenity"~"hospital|clinic|veterinary|doctors"](around:${radius},${userLat},${userLng});
  way["amenity"~"hospital|clinic|veterinary"](around:${radius},${userLat},${userLng});
  node["healthcare"~"hospital|veterinary"](around:${radius},${userLat},${userLng});
  way["healthcare"~"hospital|veterinary"](around:${radius},${userLat},${userLng});
);
out center 100;
`.trim();

    const data = await queryOverpass(query);

    const seen = new Set<string>();
    const hospitals = (data.elements as OverpassElement[])
      .map((el) => {
        const tags = el.tags || {};
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (!elLat || !elLng) return null;

        const name =
          tags["name:hi"] ||
          tags["name"] ||
          tags["name:en"] ||
          "अज्ञात अस्पताल";

        const amenity = tags["amenity"] || tags["healthcare"] || "";
        const isVet = amenity === "veterinary" || tags["healthcare"] === "veterinary";

        const distanceKm = Math.round(haversineDistance(userLat, userLng, elLat, elLng) * 10) / 10;

        return {
          id: `${el.type}-${el.id}`,
          name,
          type: isVet ? "vet" : "hospital",
          address: getAddress(tags),
          distanceKm,
          distanceText: `${distanceKm.toFixed(1)} km`,
          travelTime: estimateTravelTime(distanceKm),
          open: isOpenNow(tags),
          phone: tags["phone"] || tags["contact:phone"] || null,
          lat: elLat,
          lng: elLng,
          website: tags["website"] || tags["contact:website"] || null,
          emergency: tags["emergency"] === "yes",
          beds: tags["beds"] || null,
        };
      })
      .filter((h): h is NonNullable<typeof h> => {
        if (!h) return false;
        const key = `${h.name.toLowerCase().trim()}-${Math.round(h.lat * 100)}-${Math.round(h.lng * 100)}`;
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
