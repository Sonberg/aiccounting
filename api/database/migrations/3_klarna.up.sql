CREATE TABLE
    tenant_klarna (
        tenant_id BIGINT NOT NULL,
        clientId TEXT NOT NULL,
        clientSecret TEXT NOT NULL,
        PRIMARY KEY (tenant_id)
    );