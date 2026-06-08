import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { OSINTEvent } from '../types';
import { EVENT_COLORS } from '../types';
import { Crosshair, Layers } from 'lucide-react';

// Custom pulse icon generator
function createPulseIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="position: absolute; inset: 0; border-radius: 50%; background: ${color}; opacity: 0.3; animation: pulse-ring 2s infinite;" />
        <div style="position: absolute; inset: 6px; border-radius: 50%; background: ${color}; border: 2px solid #0a0e17; box-shadow: 0 0 10px ${color};" />
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function MapController({ events }: { events: OSINTEvent[] }) {
  const map = useMap();

  useEffect(() => {
    const withCoords = events.filter(e => e.coordinates);
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map(e => e.coordinates));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    }
  }, [map, events]);

  return null;
}

export default function MapPanel({ 
  events, 
  selectedEvent, 
  onSelectEvent 
}: { 
  events: OSINTEvent[]; 
  selectedEvent: OSINTEvent | null;
  onSelectEvent: (e: OSINTEvent) => void;
}) {
  const [layer, setLayer] = useState<'dark' | 'satellite'>('dark');
  const mapRef = useRef<L.Map | null>(null);

  const tileUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Global Event Monitor</span>
        <div className="flex gap-2">
          <button 
            onClick={() => setLayer(l => l === 'dark' ? 'satellite' : 'dark')}
            className="p-1 hover:text-osint-cyan transition-colors"
            title="Toggle layer"
          >
            <Layers size={14} />
          </button>
          <button 
            onClick={() => mapRef.current?.setView([20, 0], 2)}
            className="p-1 hover:text-osint-cyan transition-colors"
            title="Reset view"
          >
            <Crosshair size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={18}
          style={{ height: '100%', width: '100%', background: '#0a0e17' }}
          ref={mapRef}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={tileUrls[layer]}
          />
          <MapController events={events} />

          {events.filter(e => e.coordinates).map(event => (
            <Marker
              key={event.id}
              position={event.coordinates!}
              icon={createPulseIcon(EVENT_COLORS[event.type])}
              eventHandlers={{
                click: () => onSelectEvent(event),
              }}
            >
              <Popup>
                <div className="font-sans min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ background: EVENT_COLORS[event.type] }} 
                    />
                    <span className="text-xs font-bold uppercase text-slate-400">{event.source}</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{event.title}</h3>
                  <p className="text-xs text-slate-400 mb-2">{event.excerpt}</p>
                  <div className="flex gap-1 flex-wrap">
                    {event.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-500">
                    Confidence: {event.confidence}% | Reliability: {event.sourceReliability}%
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-[400]">
          {Object.entries(EVENT_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 bg-slate-900/90 border border-osint-border px-2 py-1 rounded text-[10px] text-slate-400 backdrop-blur">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>

        {/* Active regions overlay */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-osint-border rounded-md p-3 font-mono text-[10px] text-slate-400 backdrop-blur z-[400]">
          <div className="text-osint-cyan mb-1 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-osint-cyan animate-pulse" />
            ACTIVE REGIONS
          </div>
          <div>Monitoring {events.length} sectors</div>
          <div className="mt-1 text-slate-500">Last update: {new Date().toISOString().split('T')[1].split('.')[0]}</div>
        </div>
      </div>
    </div>
  );
}
