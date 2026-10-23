-- ========================================================
-- Supabase Schema for AquaWard AI (Ward Water Quality Reporter)
-- Ziro Agentic AI Hackathon 2026 · Agents for Bharat
-- ========================================================

-- 1. Table for Ward Water Quality Reporter Inputs
CREATE TABLE IF NOT EXISTS ward_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(64) UNIQUE NOT NULL,
    ward_id VARCHAR(64) NOT NULL,
    ward_number INT,
    ward_name VARCHAR(255) NOT NULL,
    city VARCHAR(128),
    state VARCHAR(128),
    period VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table for Source Evidence & Browserbase Replays
CREATE TABLE IF NOT EXISTS source_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(64) REFERENCES ward_inputs(request_id) ON DELETE CASCADE,
    source_dashboard VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    laboratory_id VARCHAR(128),
    sampling_location TEXT,
    sample_date DATE,
    retrieval_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    browserbase_session_id VARCHAR(128),
    browserbase_replay_url TEXT,
    all_figures_sourced BOOLEAN DEFAULT true,
    verification_status VARCHAR(64) DEFAULT 'VERIFIED'
);

-- 3. Table for Parameter Measurements (BIS IS 10500:2012)
CREATE TABLE IF NOT EXISTS parameter_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(64) REFERENCES ward_inputs(request_id) ON DELETE CASCADE,
    param_key VARCHAR(64) NOT NULL,
    param_name VARCHAR(128) NOT NULL,
    category VARCHAR(128),
    raw_value NUMERIC,
    raw_unit VARCHAR(32),
    normalized_value NUMERIC,
    normalized_unit VARCHAR(32),
    acceptable_limit NUMERIC,
    permissible_limit NUMERIC,
    status VARCHAR(32) NOT NULL, -- SAFE, PERMISSIBLE, HAZARDOUS
    is_safe BOOLEAN NOT NULL,
    conversion_formula TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table for Action States & Human Approval Gates
CREATE TABLE IF NOT EXISTS action_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(64) REFERENCES ward_inputs(request_id) ON DELETE CASCADE,
    content_hash VARCHAR(128) UNIQUE NOT NULL,
    status VARCHAR(64) NOT NULL, -- PENDING_APPROVAL, APPROVED, FLAGGED_FOR_REAUDIT
    destination TEXT NOT NULL,
    proposed_action TEXT NOT NULL,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    compiled_report_id VARCHAR(64),
    idempotent_cached BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table for Official Test Suite Results (TC1 to TC4)
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id VARCHAR(16) NOT NULL,
    scenario VARCHAR(255) NOT NULL,
    expected TEXT NOT NULL,
    actual TEXT NOT NULL,
    passed BOOLEAN NOT NULL,
    evidence_json JSONB,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
