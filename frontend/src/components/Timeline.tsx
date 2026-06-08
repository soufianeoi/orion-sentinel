import { useState, useRef } from 'react';
import type { TimelineNode, OSINTEvent } from '../types';
import { Clock, ChevronLeft, ChevronRight, Link2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Timeline({
  nodes,
  events,
  onSelectEvent,
}: {
  nodes: TimelineNode[];
  events: OSINTEvent[];
  onSelectEvent: (e: OSINTEvent) => void;
}) {
  const [progress, setProgress] = useState(65);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setProgress(pct);
  };

  const correlatedEvents = events.filter(e => 
    nodes.some(n => n.eventIds.includes(e.id))
  );

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span className="flex items-center gap-2">
          <Clock size={12} />
          Temporal Analysis
        </span>
        <div className="flex gap-1">
          <button className="p-1 hover:text-osint-cyan transition-colors"><ChevronLeft size={12} /></button>
          <button className="p-1 hover:text-osint-cyan transition-colors"><ChevronRight size={12} /></button>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-slate-500 font-mono uppercase">Historical Correlation</span>
          <span className="text-[10px] text-osint-cyan font-mono">{format(new Date(), 'MMM yyyy')}</span>
        </div>

        {/* Timeline Track */}
        <div 
          ref={trackRef}
          className="relative h-1.5 bg-slate-800 rounded-full cursor-pointer mb-2"
          onMouseDown={(e) => { isDragging.current = true; handleMove(e.clientX); }}
          onMouseMove={(e) => { if (isDragging.current) handleMove(e.clientX); }}
          onMouseUp={() => isDragging.current = false}
          onMouseLeave={() => isDragging.current = false}
        >
          <div 
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-osint-cyan to-osint-blue"
            style={{ width: `${progress}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-osint-cyan rounded-full border-2 border-osint-bg shadow-lg shadow-cyan-500/30 cursor-grab active:cursor-grabbing"
            style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-600 font-mono mb-4">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:59</span>
        </div>

        {/* Timeline Cards */}
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
          {nodes.map((node, i) => (
            <div 
              key={node.id}
              className="min-w-[220px] bg-slate-900 border border-osint-border rounded-lg p-3 hover:border-osint-cyan/30 transition-all cursor-pointer group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-[10px] text-osint-cyan font-mono mb-1.5">{node.timestamp}</div>
              <h4 className="text-xs font-semibold text-slate-200 mb-1 group-hover:text-white">{node.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{node.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Link2 size={10} />
                  <span>{node.eventIds.length} events</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  r={node.correlation.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Correlation Strip */}
        <div className="mt-3 pt-3 border-t border-osint-border">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-2">Correlated Events</div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin">
            {correlatedEvents.map(event => (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="flex-shrink-0 px-2 py-1 rounded bg-slate-800 border border-osint-border text-[10px] text-slate-300 hover:border-osint-cyan hover:text-white transition-all"
              >
                {event.title.slice(0, 30)}...
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
