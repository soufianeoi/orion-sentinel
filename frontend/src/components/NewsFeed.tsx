import { useState } from 'react';
import type { OSINTEvent, FilterType } from '../types';
import { EVENT_COLORS } from '../types';
import { Filter, ExternalLink } from 'lucide-react';

const filters: { label: string; value: FilterType }[] = [
  { label: 'ALL', value: 'all' },
  { label: 'CONFLICT', value: 'conflict' },
  { label: 'ECONOMIC', value: 'economic' },
  { label: 'DIPLOMATIC', value: 'diplomatic' },
  { label: 'CYBER', value: 'cyber' },
  { label: 'ENV', value: 'environmental' },
];

export default function NewsFeed({
  events,
  filter,
  setFilter,
  onSelectEvent,
}: {
  events: OSINTEvent[];
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  onSelectEvent: (e: OSINTEvent) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span className="flex items-center gap-2">
          <Filter size={12} />
          Curated Intelligence
        </span>
        <span className="text-slate-600 font-mono">{events.length} events</span>
      </div>

      <div className="flex gap-1 p-2 bg-slate-900/50 border-b border-osint-border overflow-x-auto scrollbar-thin">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-osint-cyan/10 text-osint-cyan border border-osint-cyan/30'
                : 'text-slate-500 border border-transparent hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-600 text-sm">No events match current filter</div>
        ) : (
          events.map((event, i) => (
            <div
              key={event.id}
              onClick={() => {
                onSelectEvent(event);
                setExpandedId(expandedId === event.id ? null : event.id);
              }}
              className={`p-3 rounded-md cursor-pointer transition-all border ${
                expandedId === event.id
                  ? 'bg-slate-800/80 border-osint-cyan/30'
                  : 'bg-slate-800/30 border-transparent hover:bg-slate-800/60 hover:border-osint-border'
              }`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex justify-between items-start mb-1.5">
                <span 
                  className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded font-mono"
                  style={{ 
                    color: EVENT_COLORS[event.type], 
                    background: `${EVENT_COLORS[event.type]}15` 
                  }}
                >
                  {event.source}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{event.timestamp}</span>
              </div>

              <h3 className="text-sm font-medium text-slate-200 mb-1 leading-snug">{event.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{event.excerpt}</p>

              {expandedId === event.id && event.content && (
                <div className="mt-3 pt-3 border-t border-osint-border text-xs text-slate-400 leading-relaxed">
                  {event.content}
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1 flex-wrap">
                  {event.tags.slice(0, 3).map(tag => (
                    <span 
                      key={tag} 
                      className="text-[9px] px-1.5 py-0.5 rounded border font-mono"
                      style={{ 
                        color: EVENT_COLORS[event.type], 
                        borderColor: `${EVENT_COLORS[event.type]}30`,
                        background: `${EVENT_COLORS[event.type]}08`
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <span>{event.confidence}% conf</span>
                  <ExternalLink size={10} className="ml-1" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
