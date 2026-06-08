-- OSINT Platform Database Schema
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Events table (core intelligence data)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT,
    content TEXT,
    source VARCHAR(100) NOT NULL,
    source_reliability SMALLINT CHECK (source_reliability BETWEEN 0 AND 100),
    event_type VARCHAR(50) NOT NULL,
    confidence SMALLINT CHECK (confidence BETWEEN 0 AND 100),
    region VARCHAR(100),
    coordinates GEOGRAPHY(POINT, 4326),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    indexed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline correlation nodes
CREATE TABLE timeline_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_timestamp TIMESTAMPTZ NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    correlation_score DECIMAL(3,2),
    event_ids UUID[] REFERENCES events(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Source tracking and reliability scoring
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50), -- news, satellite, social, official
    reliability_score DECIMAL(4,1) DEFAULT 50.0,
    last_active TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System metrics history
CREATE TABLE metrics_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    precision_score DECIMAL(4,1),
    reactivity_ms INTEGER,
    reliability_percent DECIMAL(4,1),
    events_count INTEGER,
    sources_active INTEGER,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_region ON events(region);
CREATE INDEX idx_events_timestamp ON events(created_at DESC);
CREATE INDEX idx_events_coords ON events USING GIST(coordinates);
CREATE INDEX idx_events_tags ON events USING GIN(tags);
CREATE INDEX idx_events_confidence ON events(confidence DESC);
CREATE INDEX idx_metrics_recorded ON metrics_history(recorded_at DESC);

-- Full-text search on event content
CREATE INDEX idx_events_search ON events 
    USING GIN(to_tsvector('english', title || ' ' || COALESCE(excerpt, '') || ' ' || COALESCE(content, '')));

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views
CREATE VIEW event_summary AS
SELECT 
    id,
    title,
    source,
    event_type,
    confidence,
    region,
    created_at,
    ST_X(coordinates::geometry) as longitude,
    ST_Y(coordinates::geometry) as latitude
FROM events;
