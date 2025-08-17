CREATE TABLE auth_refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,   -- store a SHA-256 or bcrypt hash of the refresh token
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,     -- set when user logs out or token is invalidated
    user_agent TEXT,            -- optional: to track device/browser
    ip_address INET             -- optional: to track where token was issued
);

-- Index for quick lookup when validating tokens
CREATE INDEX idx_refresh_tokens_user_id ON auth_refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON auth_refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON auth_refresh_tokens(expires_at);
