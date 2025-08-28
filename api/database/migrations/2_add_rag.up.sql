CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE
    rag_embeddings (
        id BIGINT PRIMARY KEY,
        tenant_id BIGINT NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
        table_name TEXT NOT NULL, -- e.g. 'fortnox_vouchers', 'klarna_payouts'
        row_id BIGINT NOT NULL, -- PK value in that table
        embedding vector (1536) NOT NULL,
        summary TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT now (),
        UNIQUE (table_name, row_id) -- only one embedding per row
    );

CREATE INDEX rag_embeddings_table_idx ON rag_embeddings (table_name, row_id);

CREATE INDEX rag_embeddings_tenant_idx ON rag_embeddings (tenant_id);