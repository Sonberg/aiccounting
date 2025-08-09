CREATE TABLE tokens (
  id BIGSERIAL PRIMARY KEY,
  tenant_id SERIAL NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);
