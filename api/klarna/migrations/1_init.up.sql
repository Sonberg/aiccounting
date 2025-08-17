CREATE TABLE
    settlements (
        id BIGSERIAL PRIMARY KEY,
        settlement_id TEXT UNIQUE NOT NULL,
        payment_reference TEXT UNIQUE NOT NULL,
        payout_date DATE NOT NULL,
        currency TEXT NOT NULL,
        total_amount_cents BIGINT NOT NULL created_at TIMESTAMPTZ DEFAULT now (),
        raw_json JSONB NOT NULL
    );

CREATE TABLE
    settlement_transactions (
        id BIGSERIAL PRIMARY KEY,
        transaction_id TEXT UNIQUE NOT NULL,
        settlement_id TEXT NOT NULL REFERENCES settlements (settlement_id) ON DELETE CASCADE,
        transaction_date DATE NOT NULL,
        payment_reference TEXT,
        amount_cents BIGINT NOT NULL, -- minor units
        type TEXT NOT NULL,
        status TEXT,
        created_at TIMESTAMPTZ DEFAULT now (),
        raw_json JSONB NOT NULL
    );