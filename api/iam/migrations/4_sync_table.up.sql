CREATE TABLE
    sync_jobs (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        finished_at TIMESTAMPTZ,
        status TEXT NOT NULL
    );

CREATE TABLE
    sync_items (
        id BIGSERIAL PRIMARY KEY,
        job_id BIGINT NOT NULL REFERENCES sync_jobs (id) ON DELETE CASCADE,
        source TEXT NOT NULL, -- e.g. "voucher", "voucher_row", "settlement"
        source_type TEXT NOT NULL, -- e.g. "voucher", "voucher_row", "settlement"
        source_id TEXT, -- external identifier (from Fortnox/Klarna)
        status TEXT NOT NULL, -- pending|processing|success|failed
        error TEXT,
        started_at TIMESTAMPTZ,
        finished_at TIMESTAMPTZ,
        UNIQUE (job_id, source, source_type, source_id)
    );

CREATE INDEX idx_sync_items_job_id ON sync_items (job_id);

CREATE INDEX idx_sync_items_status ON sync_items (status);

CREATE INDEX idx_sync_jobs_status ON sync_jobs (status);