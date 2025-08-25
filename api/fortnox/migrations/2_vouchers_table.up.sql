CREATE TABLE
    vouchers (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        approval_state INT NOT NULL,
        year INT NOT NULL,
        voucher_number INT NOT NULL,
        voucher_series TEXT NOT NULL,
        transaction_date DATE NOT NULL,
        description TEXT,
        raw_json JSONB NOT NULL,
        synced_at TIMESTAMPTZ DEFAULT now (),
        UNIQUE (voucher_series, voucher_number)
    );