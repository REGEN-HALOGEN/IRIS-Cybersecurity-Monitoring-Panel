CREATE TABLE telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TYPE alert_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE alert_status AS ENUM ('open', 'investigating', 'resolved');
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    alert_type VARCHAR(255) NOT NULL,
    severity alert_severity NOT NULL,
    status alert_status NOT NULL DEFAULT 'open',
    telemetry_snapshot JSONB,
    explanation TEXT,
    risk_level VARCHAR(50),
    action_steps JSONB,
    is_ai_fallback BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
