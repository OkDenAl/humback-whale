CREATE TABLE IF NOT EXISTS password_reset_token (
    token VARCHAR(255) PRIMARY KEY,
    user_id UUID,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_token(user_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx ON password_reset_token(expires_at);