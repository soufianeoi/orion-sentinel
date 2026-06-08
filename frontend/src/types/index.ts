export interface OSINTEvent {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  source: string;
  sourceReliability: number; // 0-100
  timestamp: string;
  type: 'conflict' | 'economic' | 'diplomatic' | 'cyber' | 'environmental';
  coordinates: [number, number]; // [lat, lon]
  tags: string[];
  confidence: number;
  region: string;
}

export interface MetricData {
  precision: number;
  reactivity: number;
  reliability: number;
  accessibility: string;
  sourcesActive: number;
  eventsLast24h: number;
}

export interface TimelineNode {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  eventIds: string[];
  correlation: number;
}

export type FilterType = 'all' | 'conflict' | 'economic' | 'diplomatic' | 'cyber' | 'environmental';

export const EVENT_COLORS: Record<string, string> = {
  conflict: '#ef4444',
  economic: '#f59e0b',
  diplomatic: '#3b82f6',
  cyber: '#06b6d4',
  environmental: '#10b981',
};
