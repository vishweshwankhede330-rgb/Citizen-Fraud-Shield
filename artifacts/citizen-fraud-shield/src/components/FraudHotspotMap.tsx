import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useStore, CITY_COORDS, CITY_LIST, type City } from "@/lib/store";

const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [4, 60],
  [40, 100],
];

interface CityStats {
  city: City;
  coords: [number, number];
  total: number;
  highRisk: number;
}

export default function FraudHotspotMap() {
  const { history } = useStore();

  const cityStats = useMemo<CityStats[]>(() => {
    const counts: Record<string, { total: number; highRisk: number }> = {};

    for (const check of history) {
      const city = check.city;
      if (!city) continue;
      if (!counts[city]) counts[city] = { total: 0, highRisk: 0 };
      counts[city].total += 1;
      if (check.riskLevel === "High Risk") counts[city].highRisk += 1;
    }

    return CITY_LIST.filter((c) => counts[c])
      .map((city) => ({
        city,
        coords: CITY_COORDS[city],
        total: counts[city].total,
        highRisk: counts[city].highRisk,
      }))
      .filter((s) => s.total > 0);
  }, [history]);

  const maxHigh = useMemo(
    () => Math.max(1, ...cityStats.map((s) => s.highRisk)),
    [cityStats]
  );

  function getMarkerStyle(highRisk: number, total: number) {
    const ratio = highRisk / Math.max(1, total);
    const intensity = highRisk / maxHigh;
    const radius = 10 + intensity * 22;

    let fillColor: string;
    let fillOpacity: number;
    if (ratio >= 0.7) {
      fillColor = "#FF6B6B";
      fillOpacity = 0.55 + intensity * 0.3;
    } else if (ratio >= 0.4) {
      fillColor = "#FFC857";
      fillOpacity = 0.5 + intensity * 0.25;
    } else {
      fillColor = "#4ADE80";
      fillOpacity = 0.45;
    }

    return { radius, fillColor, fillOpacity, color: "#0F1419", weight: 1.5 };
  }

  return (
    <div className="border border-border overflow-hidden rounded-lg bg-card">
      <div className="bg-card px-6 py-5 border-b border-border">
        <h2 className="text-[20px] font-semibold text-foreground">Fraud Hotspot Map</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Marker size and color reflect High Risk report concentration by city.
        </p>
      </div>

      <div style={{ height: 420 }}>
        <MapContainer
          center={[22.5, 78.9]}
          zoom={5}
          minZoom={4}
          maxBounds={INDIA_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {cityStats.map((stat) => {
            const style = getMarkerStyle(stat.highRisk, stat.total);
            return (
              <CircleMarker
                key={stat.city}
                center={stat.coords}
                radius={style.radius}
                pathOptions={{
                  fillColor: style.fillColor,
                  fillOpacity: style.fillOpacity,
                  color: style.color,
                  weight: style.weight,
                }}
              >
                <Popup>
                  <div className="text-sm font-sans min-w-[140px]">
                    <p className="font-semibold text-foreground mb-1">{stat.city}</p>
                    <p className="text-muted-foreground">Total checks: <span className="font-semibold text-foreground">{stat.total}</span></p>
                    <p style={{ color: "#FF6B6B" }}>High Risk: <span className="font-semibold">{stat.highRisk}</span></p>
                    {stat.total - stat.highRisk > 0 && (
                      <p className="text-muted-foreground">Other: {stat.total - stat.highRisk}</p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="bg-card px-6 py-4 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[#FF6B6B] opacity-80"></span>
          High concentration (&ge;70% High Risk)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[#FFC857] opacity-80"></span>
          Moderate concentration
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[#4ADE80] opacity-80"></span>
          Low concentration
        </span>
        <span className="flex items-center gap-1.5 ml-auto italic">
          Marker size = relative report volume
        </span>
      </div>
    </div>
  );
}
