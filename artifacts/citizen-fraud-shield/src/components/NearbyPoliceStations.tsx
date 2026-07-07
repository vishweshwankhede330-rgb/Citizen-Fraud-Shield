import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CITY_COORDS, type City } from "@/lib/store";
import { Navigation, MapPin } from "lucide-react";

interface PoliceStation {
  id: number;
  lat: number;
  lon: number;
  name: string;
  address: string;
}

interface NearbyPoliceStationsProps {
  city: City;
  pincode?: string;
}

/**
 * Resolve the best available coordinates for the given pincode / city.
 *
 * IMPORTANT: re-throws AbortError so the caller can detect a cancelled fetch
 * and avoid falling back to city-centre coords (which would silently produce
 * empty results if the city centre happens to have no listed stations).
 */
async function resolveCoords(
  city: City,
  pincode?: string,
  signal?: AbortSignal,
): Promise<[number, number]> {
  if (pincode && /^\d{6}$/.test(pincode)) {
    try {
      const res = await fetch(
        `/api/pincode?code=${encodeURIComponent(pincode)}`,
        { signal },
      );
      if (res.ok) {
        const data = (await res.json()) as { lat: number; lon: number };
        if (Number.isFinite(data.lat) && Number.isFinite(data.lon)) {
          return [data.lat, data.lon];
        }
      }
    } catch (err) {
      // Re-throw AbortError — the effect cleanup intentionally cancelled this
      // request. Do NOT fall back to city coords on abort; a fresh effect run
      // will start immediately with the correct pincode.
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      // For genuine network / parse failures, fall through to city coords.
    }
  }
  return CITY_COORDS[city];
}

export default function NearbyPoliceStations({
  city,
  pincode,
}: NearbyPoliceStationsProps) {
  const [stations, setStations] = useState<PoliceStation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [center, setCenter] = useState<[number, number]>(CITY_COORDS[city]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    setFetchError(false);
    setStations(null);

    async function run() {
      try {
        // 1. Resolve coordinates — uses pincode when available, falls back to
        //    city centre only on genuine errors (not on abort).
        const [lat, lon] = await resolveCoords(city, pincode, signal);
        setCenter([lat, lon]);

        // 2. Query Overpass for police amenities within 4 km
        const query =
          `[out:json][timeout:15];` +
          `(node["amenity"="police"](around:4000,${lat},${lon});` +
          `way["amenity"="police"](around:4000,${lat},${lon}););` +
          `out center;`;

        const res = await fetch(
          `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
          { signal },
        );
        if (!res.ok) throw new Error("Overpass request failed");

        const data = (await res.json()) as { elements: unknown[] };

        const results: PoliceStation[] = (
          data.elements as Record<string, unknown>[]
        )
          .map((el) => {
            const elLat =
              typeof el.lat === "number"
                ? el.lat
                : (el.center as { lat: number } | undefined)?.lat;
            const elLon =
              typeof el.lon === "number"
                ? el.lon
                : (el.center as { lon: number } | undefined)?.lon;

            const tags = (el.tags as Record<string, string>) ?? {};
            const addressParts = [
              tags["addr:housenumber"],
              tags["addr:street"],
              tags["addr:suburb"] ?? tags["addr:locality"],
              tags["addr:city"],
            ].filter(Boolean);

            return {
              id: el.id as number,
              lat: elLat as number,
              lon: elLon as number,
              name: tags["name"] ?? tags["name:en"] ?? "Police Station",
              address:
                addressParts.join(", ") || tags["addr:full"] || "",
            };
          })
          .filter((s) => s.lat != null && s.lon != null);

        setStations(results);
      } catch (err: unknown) {
        // Silently ignore aborts — the cleanup has already fired or Strict Mode
        // is doing its unmount/remount cycle. A fresh run will follow.
        if (signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setFetchError(true);
      } finally {
        // Only update loading state if this effect run was NOT cancelled.
        // If it was cancelled, the next run's state update takes over.
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => controller.abort();
  }, [city, pincode]); // eslint-disable-line react-hooks/exhaustive-deps

  const noResults =
    !loading && !fetchError && stations !== null && stations.length === 0;
  const showFallback = fetchError || noResults;

  const locationLabel = pincode ? `Pincode ${pincode}` : city;

  return (
    <div className="rounded-lg border border-border bg-white p-5 space-y-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <MapPin className="h-4 w-4 flex-shrink-0 text-primary" strokeWidth={1.5} />
        Nearby Police Stations
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          near {locationLabel}
        </span>
      </h2>

      {/* Guidance text */}
      <div className="bg-background rounded-lg p-4 border border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          You can also visit one of these nearby police stations in person to
          report this cybercrime. Bring any evidence you have (screenshots,
          call recordings, transaction details) if possible.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">
          Searching for nearby stations…
        </p>
      )}

      {showFallback && (
        <p className="text-sm text-muted-foreground">
          No listed stations found — please use the Cyber Crime Portal link
          above, or dial{" "}
          <span className="font-semibold text-foreground">100</span> for local
          police.
        </p>
      )}

      {!loading && !fetchError && stations && stations.length > 0 && (
        <>
          {/* Embedded map */}
          <div
            style={{ height: 220 }}
            className="rounded-lg overflow-hidden border border-border"
          >
            <MapContainer
              center={center}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {stations.map((station) => (
                <CircleMarker
                  key={station.id}
                  center={[station.lat, station.lon]}
                  radius={8}
                  pathOptions={{
                    fillColor: "#2C4A6B",
                    fillOpacity: 0.85,
                    color: "#fff",
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-sm font-sans min-w-[140px]">
                      <p className="font-semibold mb-0.5">{station.name}</p>
                      {station.address && (
                        <p className="text-xs text-gray-500">
                          {station.address}
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {/* Station list */}
          <ul className="space-y-2">
            {stations.map((station) => (
              <li
                key={station.id}
                className="flex items-start gap-3 bg-background rounded-lg border border-border px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {station.name}
                  </p>
                  {station.address && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {station.address}
                    </p>
                  )}
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#3D7A8A] hover:underline underline-offset-2 mt-0.5"
                >
                  <Navigation className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Get Directions
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
