CREATE TABLE
    matches (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGSERIAL NOT NULL,
        voucher_id BIGSERIAL,
        payout_id BIGSERIAL NOT NULL,
        model TEXT NOT NULL,
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now (),
    );

CREATE TABLE
    suggestions (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGSERIAL NOT NULL,
        payout_id BIGSERIAL NOT NULL,
        voucher_series TEXT NOT NULL,
        model TEXT NOT NULL,
        confidence TEXT NOT NULL,
        year TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now (),
    );

CREATE TABLE
    suggestion_rows (
        id BIGSERIAL PRIMARY KEY,
        suggestion_id BIGINT NOT NULL REFERENCES suggestions (id) ON DELETE CASCADE,
        account TEXT NOT NULL,
        debit NUMERIC(12, 2),
        credit NUMERIC(12, 2),
        description TEXT NOT NULL,
        explanation TEXT,
        created_at TIMESTAMPTZ DEFAULT now ()
    );

CREATE INDEX idx_suggestions_tx_id ON ai_suggestions (transaction_id);

CREATE INDEX idx_suggestion_rows_suggestion_id ON ai_suggestion_rows (suggestion_id);