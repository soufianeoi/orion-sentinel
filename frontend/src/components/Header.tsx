import { Activity, Shield, Zap, Eye, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Header({ connected }: { connected: boolean }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pillars = [
    { name: 'Precision', icon: Eye, active: true },
    { name: 'Reactivity', icon: Zap, active: true },
    { name: 'Reliability', icon: Shield, active: true },
    { name: 'Accessibility', icon: Globe, active: true },
  ];

  return (
    <header className="h-14 bg-slate-900/90 border-b border-osint-border flex items-center justify-between px-6 relative z-50 backdrop-blur-md">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-osint-cyan to-transparent opacity-50" />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-osint-cyan to-osint-blue rounded-md flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
          OS
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wide bg-gradient-to-r from-white to-osint-cyan bg-clip-text text-transparent">
            ORION SENTINEL
          </h1>
          <p className="text-[10px] text-slate-500 font-mono">Open Source Intelligence Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {pillars.map((pillar) => (
          <div key={pillar.name} className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-osint-cyan transition-colors cursor-default">
            <pillar.icon size={14} className={pillar.active ? 'text-osint-cyan' : ''} />
            <span className="hidden md:inline">{pillar.name}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-5 font-mono text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500'} animate-pulse`} />
          <span className="hidden sm:inline">{connected ? 'LIVE FEED' : 'OFFLINE'}</span>
        </div>
        <span>{time.toISOString().split('T')[1].split('.')[0]} UTC</span>
        <span className="text-slate-600">SRC: 847</span>
      </div>
    </header>
  );
}
