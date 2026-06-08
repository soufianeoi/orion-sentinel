import { useCallback } from 'react';
import Header from './components/Header';
import MapPanel from './components/MapPanel';
import NewsFeed from './components/NewsFeed';
import Timeline from './components/Timeline';
import Metrics from './components/Metrics';
import { useOSINTData } from './hooks/useOSINTData';
import { useWebSocket } from './hooks/useWebSocket';

export default function App() {
  const {
    filteredEvents,
    metrics,
    timeline,
    filter,
    setFilter,
    selectedEvent,
    setSelectedEvent,
  } = useOSINTData();

  const handleNewEvent = useCallback((event) => {
    // Could trigger toast notification or auto-scroll
    console.log('Real-time event:', event);
  }, []);

  const { connected } = useWebSocket(handleNewEvent);

  return (
    <div className="h-screen w-screen flex flex-col bg-osint-bg overflow-hidden">
      <Header connected={connected} />

      <main className="flex-1 grid grid-cols-[1fr_380px] grid-rows-[1fr_280px] gap-3 p-3 min-h-0">
        {/* Map - Top Left */}
        <div className="min-h-0">
          <MapPanel 
            events={filteredEvents} 
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
          />
        </div>

        {/* News Feed - Top Right */}
        <div className="min-h-0">
          <NewsFeed
            events={filteredEvents}
            filter={filter}
            setFilter={setFilter}
            onSelectEvent={setSelectedEvent}
          />
        </div>

        {/* Timeline - Bottom Left */}
        <div className="min-h-0">
          <Timeline 
            nodes={timeline} 
            events={filteredEvents}
            onSelectEvent={setSelectedEvent}
          />
        </div>

        {/* Metrics - Bottom Right */}
        <div className="min-h-0">
          <Metrics metrics={metrics} />
        </div>
      </main>

      {/* Detail Modal Overlay */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="bg-osint-panel border border-osint-border rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-osint-border flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">{selectedEvent.title}</h2>
                <div className="text-xs text-slate-500 font-mono">
                  {selectedEvent.source} • {selectedEvent.timestamp} • Confidence: {selectedEvent.confidence}%
                </div>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-osint-border text-slate-400 hover:text-red-400 hover:border-red-400/50 hover:bg-red-400/10 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto scrollbar-thin">
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-slate-300 leading-relaxed">{selectedEvent.excerpt}</p>
                <p className="text-slate-400 leading-relaxed mt-4">
                  <strong className="text-slate-200">Analysis:</strong> Multiple independent sources corroborate this development. 
                  Geospatial data aligns with HUMINT reports received in the last 6 hours. 
                  Trend correlation indicates elevated probability of further escalation within 48-72 hours based on historical pattern matching.
                </p>
                <p className="text-slate-400 leading-relaxed mt-4">
                  <strong className="text-slate-200">Recommended Action:</strong> Continue monitoring primary and secondary sources. 
                  Alert threshold set at 85% confidence. Cross-reference with economic indicators for comprehensive assessment.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-osint-border flex flex-wrap gap-2">
                {selectedEvent.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-2 py-1 rounded text-[10px] font-mono border"
                    style={{ 
                      color: '#06b6d4', 
                      borderColor: 'rgba(6,182,212,0.2)',
                      background: 'rgba(6,182,212,0.05)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
