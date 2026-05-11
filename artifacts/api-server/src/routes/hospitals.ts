import { Router } from "express";

const router = Router();

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY ?? "";

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
  return (
    [
      tags["addr:housenumber"],
      tags["addr:street"],
      tags["addr:suburb"],
      tags["addr:city"],
      tags["addr:district"],
      tags["addr:state"],
    ]
      .filter(Boolean)
      .join(", ") ||
    tags["addr:full"] ||
    tags["is_in"] ||
    ""
  );
}

async function overpassGET(query: string): Promise<any> {
  const encoded = encodeURIComponent(query);
  for (const base of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(`${base}?data=${encoded}`, {
        headers: {
          "User-Agent":
            "SaharaApp/1.0 (community help India; saharaapphelp@gmail.com)",
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

function extractOpenStatus(place: any): boolean | null {
  if (
    place.businessStatus === "CLOSED_PERMANENTLY" ||
    place.businessStatus === "CLOSED_TEMPORARILY"
  ) return false;
  if (place.currentOpeningHours?.openNow !== undefined)
    return place.currentOpeningHours.openNow;
  if (place.regularOpeningHours?.openNow !== undefined)
    return place.regularOpeningHours.openNow;
  return null;
}

async function googleNearbySearch(
  lat: number,
  lng: number,
  radius: number
): Promise<any[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask":
        "places.displayName,places.location,places.currentOpeningHours,places.regularOpeningHours,places.businessStatus",
    },
    body: JSON.stringify({
      includedTypes: ["hospital", "veterinary_care", "medical_clinic", "doctor"],
      maxResultCount: 20,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius },
      },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    console.warn(`Google Places (${lat.toFixed(2)},${lng.toFixed(2)}) → ${res.status}`);
    return [];
  }
  const data = await res.json() as { places?: any[] };
  return data.places ?? [];
}

interface GooglePlaceEntry {
  lat: number;
  lng: number;
  open: boolean | null;
  name: string;
}

function normalizeName(n: string): string {
  return n
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Google Places — Grid of 9 points covering the full 100km area
async function googleNearbyOpenStatus(
  lat: number,
  lng: number
): Promise<{ byCoord: Map<string, boolean | null>; byName: Map<string, boolean | null>; entries: GooglePlaceEntry[] }> {
  const byCoord = new Map<string, boolean | null>();
  const byName = new Map<string, boolean | null>();
  const entries: GooglePlaceEntry[] = [];

  if (!GOOGLE_KEY) return { byCoord, byName, entries };

  try {
    const offset = 0.4; // ~44km
    const gridPoints = [
      [lat, lng],
      [lat + offset, lng],
      [lat - offset, lng],
      [lat, lng + offset],
      [lat, lng - offset],
      [lat + offset, lng + offset],
      [lat + offset, lng - offset],
      [lat - offset, lng + offset],
      [lat - offset, lng - offset],
    ];

    const allResults = await Promise.all(
      gridPoints.map(([gLat, gLng]) =>
        googleNearbySearch(gLat, gLng, 50000).catch(() => [] as any[])
      )
    );

    for (const places of allResults) {
      for (const place of places) {
        const pLat = place.location?.latitude;
        const pLng = place.location?.longitude;
        if (!pLat || !pLng) continue;

        const coordKey = `${pLat.toFixed(3)},${pLng.toFixed(3)}`;
        if (byCoord.has(coordKey)) continue; // already seen

        const openStatus = extractOpenStatus(place);
        byCoord.set(coordKey, openStatus);

        const placeName = place.displayName?.text ?? place.displayName ?? "";
        if (placeName) {
          const nk = normalizeName(placeName);
          if (nk && !byName.has(nk)) byName.set(nk, openStatus);
        }

        entries.push({ lat: pLat, lng: pLng, open: openStatus, name: placeName });
      }
    }
    console.log(`Google Places: ${entries.length} unique places, ${byName.size} by name from 9 grid points`);
  } catch (e: any) {
    console.warn(`Google Places failed: ${e.message}`);
  }
  return { byCoord, byName, entries };
}

router.get("/hospitals", async (req, res) => {
  try {
    const { lat, lng } = req.query as { lat?: string; lng?: string };
    if (!lat || !lng)
      return res.status(400).json({ error: "lat and lng required" });

    const uLat = parseFloat(lat);
    const uLng = parseFloat(lng);

    const deg = 0.9;
    const S = uLat - deg,
      N = uLat + deg,
      W = uLng - deg,
      E = uLng + deg;

    const query = `[out:json][timeout:20];(node["amenity"="hospital"](${S},${W},${N},${E});way["amenity"="hospital"](${S},${W},${N},${E});node["amenity"="clinic"](${S},${W},${N},${E});way["amenity"="clinic"](${S},${W},${N},${E});node["amenity"="doctors"](${S},${W},${N},${E});node["amenity"="veterinary"](${S},${W},${N},${E});way["amenity"="veterinary"](${S},${W},${N},${E});node["healthcare"="hospital"](${S},${W},${N},${E});way["healthcare"="hospital"](${S},${W},${N},${E});node["healthcare"="veterinary"](${S},${W},${N},${E});node["healthcare"="clinic"](${S},${W},${N},${E}););out center 250;`;

    // Fetch Overpass + Google open status in parallel
    const [overpassData, google] = await Promise.all([
      overpassGET(query),
      googleNearbyOpenStatus(uLat, uLng),
    ]);

    const { byCoord, byName, entries: googleEntries } = google;

    const seen = new Set<string>();
    const hospitals = (overpassData.elements as any[])
      .map((el: any) => {
        const tags: Record<string, string> = el.tags || {};
        const elLat: number = el.lat ?? el.center?.lat;
        const elLng: number = el.lon ?? el.center?.lon;
        if (!elLat || !elLng) return null;

        const name =
          tags["name:hi"] || tags["name"] || tags["name:en"] || null;
        if (!name) return null;

        const amenity = tags["amenity"] || tags["healthcare"] || "";
        const isVet =
          amenity === "veterinary" ||
          tags["healthcare"] === "veterinary" ||
          name.toLowerCase().includes("veterinary") ||
          name.toLowerCase().includes("pashu");

        const km =
          Math.round(haversineKm(uLat, uLng, elLat, elLng) * 10) / 10;
        if (km > 100) return null;

        // 1) Exact coordinate key match
        let openStatus: boolean | null = null;
        const coordKey = `${elLat.toFixed(3)},${elLng.toFixed(3)}`;
        if (byCoord.has(coordKey)) {
          openStatus = byCoord.get(coordKey) ?? null;
        } else {
          // 2) Proximity match within ~500m
          for (const entry of googleEntries) {
            if (
              Math.abs(entry.lat - elLat) < 0.005 &&
              Math.abs(entry.lng - elLng) < 0.005
            ) {
              openStatus = entry.open;
              break;
            }
          }
        }

        // 3) Name-based match as fallback
        if (openStatus === null) {
          const nk = normalizeName(name);
          if (byName.has(nk)) {
            openStatus = byName.get(nk) ?? null;
          } else {
            // Partial name match — check if any Google name contains or is contained
            for (const [gName, gOpen] of byName.entries()) {
              if (
                (nk.length >= 6 && gName.includes(nk)) ||
                (gName.length >= 6 && nk.includes(gName))
              ) {
                openStatus = gOpen;
                break;
              }
            }
          }
        }

        return {
          id: `${el.type}-${el.id}`,
          name,
          type: isVet ? "vet" : "hospital",
          address: getAddress(tags),
          distanceKm: km,
          distanceText: `${km.toFixed(1)} km`,
          travelTime: estimateTime(km),
          open: openStatus,
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

    const withStatus = hospitals.filter((h) => h.open !== null).length;
    console.log(
      `Hospitals: ${hospitals.length} total, ${withStatus} with open/closed status`
    );
    res.json({ hospitals, total: hospitals.length });
  } catch (err: any) {
    console.error("Hospital fetch error:", err.message);
    res
      .status(500)
      .json({ error: "Failed to fetch hospitals", message: err.message });
  }
});

export default router;
