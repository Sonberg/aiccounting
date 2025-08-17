CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE
    tenants (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    users (
        id BIGSERIAL PRIMARY KEY,
        email CITEXT NOT NULL UNIQUE,
        display_name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    user_tenants (
        user_id BIGSERIAL NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        tenant_id BIGSERIAL NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        PRIMARY KEY (user_id, tenant_id)
    );

CREATE TABLE
    auth_passwords (
        user_id BIGSERIAL PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_algo TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        last_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );