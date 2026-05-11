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

// Google Places Nearby Search (New) — returns open_now for nearby hospitals
async function googleNearbyOpenStatus(
  lat: number,
  lng: number
): Promise<Map<string, boolean | null>> {
  const statusMap = new Map<string, boolean | null>();
  if (!GOOGLE_KEY) return statusMap;

  try {
    // Use Places API (New) — Nearby Search
    const url = `https://places.googleapis.com/v1/places:searchNearby`;
    const body = {
      includedTypes: ["hospital", "veterinary_care", "medical_clinic", "doctor"],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 15000, // 15km for open status (closer ones more relevant)
        },
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask":
          "places.displayName,places.location,places.currentOpeningHours,places.regularOpeningHours,places.businessStatus",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Google Places error ${res.status}: ${errText.slice(0, 200)}`);
      return statusMap;
    }

    const data = await res.json() as { places?: any[] };
    for (const place of data.places ?? []) {
      const pLat = place.location?.latitude;
      const pLng = place.location?.longitude;
      if (!pLat || !pLng) continue;

      // open_now from currentOpeningHours or regularOpeningHours
      let openNow: boolean | null = null;
      if (place.currentOpeningHours?.openNow !== undefined) {
        openNow = place.currentOpeningHours.openNow;
      } else if (place.regularOpeningHours?.openNow !== undefined) {
        openNow = place.regularOpeningHours.openNow;
      }
      if (place.businessStatus === "CLOSED_PERMANENTLY" || place.businessStatus === "CLOSED_TEMPORARILY") {
        openNow = false;
      }

      // Key by rounded coordinates for matching with Overpass results
      const key = `${pLat.toFixed(3)},${pLng.toFixed(3)}`;
      statusMap.set(key, openNow);
    }
    console.log(`Google Places returned ${data.places?.length ?? 0} results, ${statusMap.size} with location`);
  } catch (e: any) {
    console.warn(`Google Places failed: ${e.message}`);
  }
  return statusMap;
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
    const [overpassData, googleStatus] = await Promise.all([
      overpassGET(query),
      googleNearbyOpenStatus(uLat, uLng),
    ]);

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

        // Try to match with Google open status (within ~300m tolerance)
        let openStatus: boolean | null = null;
        const coordKey = `${elLat.toFixed(3)},${elLng.toFixed(3)}`;
        if (googleStatus.has(coordKey)) {
          openStatus = googleStatus.get(coordKey) ?? null;
        } else {
          // Search nearby keys within 0.003 degree (~300m)
          for (const [key, val] of googleStatus.entries()) {
            const [gLat, gLng] = key.split(",").map(Number);
            if (
              Math.abs(gLat - elLat) < 0.003 &&
              Math.abs(gLng - elLng) < 0.003
            ) {
              openStatus = val;
              break;
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
