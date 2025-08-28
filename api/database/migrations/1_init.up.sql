CREATE TABLE
    tenants (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    user_tenants (
        user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        tenant_id BIGINT NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        PRIMARY KEY (user_id, tenant_id)
    );

CREATE TABLE
    auth_passwords (
        user_id BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_algo TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        last_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    auth_bankid (
        user_id BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
        personal_number TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    auth_refresh_tokens (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        user_agent TEXT,
        ip_address INET
    );

-- Index for quick lookup when validating tokens
CREATE INDEX idx_refresh_tokens_user_id ON auth_refresh_tokens (user_id);

CREATE INDEX idx_refresh_tokens_token_hash ON auth_refresh_tokens (token_hash);

CREATE INDEX idx_refresh_tokens_expires_at ON auth_refresh_tokens (expires_at);

/*
- tenants 
- users
- user_tenants
- user_auth_bankid
- user_auth_password
- klarna_payouts
- fortnox_vouchers
- fortnox_account
- fortnox_tokens
- klarna_fortnox_matches
- klarna_fortnox_suggestions 
- sync_jobs
- sync_job_items
 */
/* FORTNOX */
CREATE TABLE
    fortnox_tokens (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        tenant_id BIGINT NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL
    );

CREATE TABLE
    fortnox_vouchers (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        tenant_id BIGINT NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
        approval_state INT NOT NULL,
        year INT NOT NULL,
        voucher_number INT NOT NULL,
        voucher_series TEXT NOT NULL,
        transaction_date DATE NOT NULL,
        description TEXT,
        raw_json JSONB NOT NULL,
        synced_at TIMESTAMPTZ DEFAULT now (),
        UNIQUE (tenant_id, voucher_series, voucher_number)
    );

CREATE TABLE
    fortnox_accounts (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        tenant_id BIGINT NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
        raw_json JSONB NOT NULL,
        synced_at TIMESTAMPTZ DEFAULT now ()
    );

/*KLARNA*/
CREATE TABLE
    klarna_payouts (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        payment_reference TEXT UNIQUE NOT NULL,
        payout_date DATE NOT NULL,
        currency TEXT NOT NULL,
        tenant_id BIGINT NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
        selling_amount BIGINT NOT NULL,
        payout_amount BIGINT NOT NULL,
        tax_amount BIGINT NOT NULL,
        fee_amount BIGINT NOT NULL,
        returns_amount BIGINT NOT NULL,
        synced_at TIMESTAMPTZ DEFAULT now (),
        raw_json JSONB NOT NULL
    );

/*KLARNA -> FORTNOX*/
CREATE TABLE
    klarna_fortnox_matches (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        tenant_id BIGINT NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
        fortnox_voucher_id BIGINT NOT NULL REFERENCES fortnox_vouchers (id) ON DELETE CASCADE,
        klarna_payout_id BIGINT NOT NULL REFERENCES klarna_payouts (id) ON DELETE CASCADE,
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now ()
    );

CREATE TABLE
    klarna_fortnox_suggestions (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        tenant_id BIGINT NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
        klarna_payout_id BIGINT NOT NULL REFERENCES klarna_payouts (id) ON DELETE CASCADE,
        voucher_series TEXT NOT NULL,
        confidence TEXT NOT NULL,
        year TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now ()
    );

CREATE TABLE
    klarna_fortnox_suggestion_rows (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        klarna_fortnox_suggestion_id BIGINT NOT NULL REFERENCES klarna_fortnox_suggestions (id) ON DELETE CASCADE,
        account TEXT NOT NULL,
        debit NUMERIC(12, 2),
        credit NUMERIC(12, 2),
        description TEXT NOT NULL,
        explanation TEXT,
        created_at TIMESTAMPTZ DEFAULT now ()
    );

/*SYNC*/
CREATE TABLE
    sync_jobs (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        tenant_id BIGINT NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        finished_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NULL,
        total_count int NOT NULL DEFAULT 0,
        pending_count int NOT NULL DEFAULT 0,
        failed_count int NOT NULL DEFAULT 0,
        success_count int NOT NULL DEFAULT 0,
        status TEXT NOT NULL
    );

CREATE TABLE
    sync_job_items (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        job_id BIGINT NOT NULL REFERENCES sync_jobs (id) ON DELETE CASCADE,
        source TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT,
        status TEXT NOT NULL,
        error TEXT,
        started_at TIMESTAMPTZ,
        finished_at TIMESTAMPTZ,
        UNIQUE (job_id, source, source_type, source_id)
    );

CREATE INDEX idx_sync_job_items_job_id ON sync_job_items (job_id);

CREATE INDEX idx_sync_job_items_status ON sync_job_items (status);

CREATE INDEX idx_sync_jobs_status ON sync_jobs (status);