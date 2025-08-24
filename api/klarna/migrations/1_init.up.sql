CREATE TABLE
    payouts (
        id BIGSERIAL PRIMARY KEY,
        payment_reference TEXT UNIQUE NOT NULL,
        payout_date DATE NOT NULL,
        currency TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        selling_amount BIGINT NOT NULL,
        payout_amount BIGINT NOT NULL,
        tax_amount BIGINT NOT NULL,
        fee_amount BIGINT NOT NULL,
        returns_amount BIGINT NOT NULL,
        synced_at TIMESTAMPTZ DEFAULT now (),
        raw_json JSONB NOT NULL
    );