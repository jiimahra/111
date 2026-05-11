import { Router } from "express";

const router = Router();

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

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

function getAddress(tags: Record<string, string>): string {
  return [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:district"],
    tags["addr:state"],
  ]
    .filter(Boolean)
    .join(", ") || tags["addr:full"] || tags["is_in"] || "";
}

async function overpassGET(query: string): Promise<any> {
  const encoded = encodeURIComponent(query);
  for (const base of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(`${base}?data=${encoded}`, {
        headers: {
          "User-Agent": "SaharaApp/1.0 (community help India; saharaapphelp@gmail.com)",
        },
        signal: AbortSignal.timeout(18000),
      });
      if (!res.ok) {
        console.warn(`Overpass ${base} returned ${res.status}`);
        continue;
      }
      return await res.json();
    } catch (e: any) {
      console.warn(`Overpass ${base} failed: ${e.message}`);
    }
  }
  throw new Error("All Overpass endpoints failed");
}

router.get("/hospitals", async (req, res) => {
  try {
    const { lat, lng } = req.query as { lat?: string; lng?: string };
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

    const uLat = parseFloat(lat);
    const uLng = parseFloat(lng);

    // Bounding box ~100km
    const deg = 0.9;
    const S = uLat - deg, N = uLat + deg, W = uLng - deg, E = uLng + deg;

    // Single combined query — all hospital/clinic/vet/doctor types
    const query = `[out:json][timeout:20];(node["amenity"="hospital"](${S},${W},${N},${E});way["amenity"="hospital"](${S},${W},${N},${E});node["amenity"="clinic"](${S},${W},${N},${E});way["amenity"="clinic"](${S},${W},${N},${E});node["amenity"="doctors"](${S},${W},${N},${E});node["amenity"="veterinary"](${S},${W},${N},${E});way["amenity"="veterinary"](${S},${W},${N},${E});node["healthcare"="hospital"](${S},${W},${N},${E});way["healthcare"="hospital"](${S},${W},${N},${E});node["healthcare"="veterinary"](${S},${W},${N},${E});node["healthcare"="clinic"](${S},${W},${N},${E}););out center 250;`;

    const data = await overpassGET(query);

    const seen = new Set<string>();
    const hospitals = (data.elements as any[])
      .map((el: any) => {
        const tags: Record<string, string> = el.tags || {};
        const elLat: number = el.lat ?? el.center?.lat;
        const elLng: number = el.lon ?? el.center?.lon;
        if (!elLat || !elLng) return null;

        const name =
          tags["name:hi"] ||
          tags["name"] ||
          tags["name:en"] ||
          null;
        if (!name) return null; // skip unnamed places

        const amenity = tags["amenity"] || tags["healthcare"] || "";
        const isVet =
          amenity === "veterinary" ||
          tags["healthcare"] === "veterinary" ||
          name.toLowerCase().includes("veterinary") ||
          name.toLowerCase().includes("vet ") ||
          name.toLowerCase().includes("pashu");

        const km = Math.round(haversineKm(uLat, uLng, elLat, elLng) * 10) / 10;
        if (km > 100) return null;

        return {
          id: `${el.type}-${el.id}`,
          name,
          type: isVet ? "vet" : "hospital",
          address: getAddress(tags),
          distanceKm: km,
          distanceText: `${km.toFixed(1)} km`,
          travelTime: estimateTime(km),
          open: null as boolean | null,
          phone: tags["phone"] || tags["contact:phone"] || null,
          lat: elLat,
          lng: elLng,
          emergency: tags["emergency"] === "yes",
          beds: tags["beds"] || null,
        };
      })
      .filter((h): h is NonNullable<typeof h> => {
        if (!h) return false;
        const key = h.name.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    console.log(`Hospitals found: ${hospitals.length} (${hospitals.filter(h => h.type === "hospital").length} hospital, ${hospitals.filter(h => h.type === "vet").length} vet)`);
    res.json({ hospitals, total: hospitals.length });
  } catch (err: any) {
    console.error("Hospital fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch hospitals", message: err.message });
  }
});

export default router;
