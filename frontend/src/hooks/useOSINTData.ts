import { useState, useEffect, useCallback } from 'react';
import type { OSINTEvent, MetricData, TimelineNode, FilterType } from '../types';

const API_BASE = '/api';

export function useOSINTData() {
  const [events, setEvents] = useState<OSINTEvent[]>([]);
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [timeline, setTimeline] = useState<TimelineNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedEvent, setSelectedEvent] = useState<OSINTEvent | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [eventsRes, metricsRes, timelineRes] = await Promise.all([
        fetch(`${API_BASE}/events`),
        fetch(`${API_BASE}/metrics`),
        fetch(`${API_BASE}/timeline`),
      ]);

      const eventsData = await eventsRes.json();
      const metricsData = await metricsRes.json();
      const timelineData = await timelineRes.json();

      setEvents(eventsData);
      setMetrics(metricsData);
      setTimeline(timelineData);
      setLoading(false);
    } catch (err) {
      console.error('OSINT data fetch failed:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.type === filter);

  return {
    events,
    filteredEvents,
    metrics,
    timeline,
    loading,
    filter,
    setFilter,
    selectedEvent,
    setSelectedEvent,
    refresh: fetchData,
  };
}
