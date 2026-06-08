import type { MetricData } from '../types';
import { TrendingUp, TrendingDown, Activity, Wifi, Shield, Eye } from 'lucide-react';

export default function Metrics({ metrics }: { metrics: MetricData | null }) {
  if (!metrics) return (
    <div className="panel h-full flex items-center justify-center">
      <div className="text-slate-600 text-sm animate-pulse">Loading metrics...</div>
    </div>
  );

  const cards = [
    { 
      label: 'Precision Score', 
      value: `${metrics.precision.toFixed(1)}%`, 
      delta: '+2.1%', 
      positive: true, 
      icon: Eye,
      color: 'text-osint-cyan',
      glow: 'shadow-cyan-500/20'
    },
    { 
      label: 'Avg. Latency', 
      value: `${metrics.reactivity.toFixed(1)}s`, 
      delta: '-0.3s', 
      positive: true, 
      icon: Activity,
      color: 'text-osint-blue',
      glow: 'shadow-blue-500/20'
    },
    { 
      label: 'Uptime', 
      value: `${metrics.reliability.toFixed(1)}%`, 
      delta: '+0.1%', 
      positive: true, 
      icon: Shield,
      color: 'text-emerald-400',
      glow: 'shadow-emerald-500/20'
    },
    { 
      label: 'Accessibility', 
      value: metrics.accessibility, 
      delta: 'WCAG 2.1 AA', 
      positive: true, 
      icon: Wifi,
      color: 'text-osint-amber',
      glow: 'shadow-amber-500/20'
    },
  ];

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Source Reliability</span>
        <span className="text-slate-600 font-mono">{metrics.sourcesActive} sources</span>
      </div>

      <div className="flex-1 p-4 grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div 
            key={card.label}
            className="bg-slate-900 border border-osint-border rounded-lg p-4 flex flex-col items-center justify-center hover:border-osint-cyan/30 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <card.icon size={16} className={`mb-2 ${card.color}`} />
            <div className={`text-2xl font-bold font-mono ${card.color} ${card.glow}`}>
              {card.value}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{card.label}</div>
            <div className={`text-[10px] mt-1 font-mono flex items-center gap-1 ${card.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {card.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {card.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <div className="bg-slate-900/50 border border-osint-border rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Feed Health</span>
            <span className="text-[10px] text-emerald-400 font-mono">OPTIMAL</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-osint-cyan w-[92%] rounded-full" />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-600 font-mono">{metrics.eventsLast24h} events/24h</span>
            <span className="text-[9px] text-slate-600 font-mono">92% throughput</span>
          </div>
        </div>
      </div>
    </div>
  );
}
