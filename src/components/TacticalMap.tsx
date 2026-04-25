import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    L: any;
  }
}

type Props = {
  center: [number, number];
  zoom: number;
  locationName: string;
};

export function TacticalMap({ center, zoom, locationName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.L) {
      setLeafletReady(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!leafletReady || !containerRef.current || !center) return;
    const L = window.L;
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, zoom);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(mapRef.current);
      markerRef.current = L.circleMarker(center, {
        color: "#dc2626",
        fillColor: "#ef4444",
        fillOpacity: 0.5,
        radius: 10,
        className: "pulse-marker",
      }).addTo(mapRef.current);
    } else {
      mapRef.current.flyTo(center, zoom, { animate: true, duration: 1.4 });
      markerRef.current.setLatLng(center);
    }
  }, [leafletReady, center, zoom]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-border bg-surface shadow-soft">
      <div ref={containerRef} className="h-72 w-full" />
      <div className="absolute top-3 left-3 z-[400] glass border border-border rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-foreground flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
        {locationName || "Locating..."}
      </div>
    </div>
  );
}
